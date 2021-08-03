import path from 'path'
import { promises as fs } from 'fs'
import { Wallet } from "ethers"
import { IAM, RegistrationTypes, setCacheClientOptions } from "iam-client-lib"
import { Claim } from "iam-client-lib/dist/src/cacheServerClient/cacheServerClient.types"
import { ErrorCode, HttpApiError, HttpError, Result } from "utils"
import { config } from 'config'

const PARENT_NAMESPACE = config.iam.parentNamespace
const USER_ROLE = `user.roles.${PARENT_NAMESPACE}`
const MESSAGEBROKER_ROLE = `messagebroker.roles.${PARENT_NAMESPACE}`

enum RoleStatus {
    NO_CLAIM,
    AWAITING_APPROVAL,
    APPROVED,
}

type EnrolmentState = {
    user: RoleStatus
    messagebroker: RoleStatus
}

type IdentityManager = {
    /**
     * Decentralized Identifer (DID) belonging to gateway identity
     */
    did: string
    /**
     * Public key of associated private key of gateway
     */
    publicKey: string
    /**
     * Get enrolment status of the configured identity (private key)
     *
     * @returns individual state of messagebroker and user roles
     */
    getEnrolmentState: () => Promise<Result<EnrolmentState, HttpApiError>>
    /**
     * Creates enrolment claims (messagebroker and user) for gateway identity
     *
     * @param state current state, retreived from getEnrolmentState
     * @returns ok (boolean) or error code
     */
    handleEnrolement: (state: EnrolmentState) => Promise<Result<boolean, HttpApiError>>
    /**
     * Persists gateway identity to json file
     *
     * @returns ok (boolean) or error code
     */
    writeToFile: () => Promise<Result<boolean, HttpApiError>>
}

/**
 * Configure Identity Access Management (IAM)
 *
 * @param privateKey sets IAM to use this private key
 * @returns IdentityManager - object with helper methods to query and create claims
 */
export async function initIdentity(privateKey: string): Promise<Result<IdentityManager, HttpApiError>> {
    const { ok: wallet, err: privateKeyError } = validatePrivateKey(privateKey)
    if (!wallet) {
        return { err: privateKeyError }
    }
    const { ok: iam, err: iamError } = await initIAM(privateKey)
    if (!iam) {
        return { err: iamError }
    }
    const did = iam.getDid()
    if (!did) {
        // TODO: create DID for identity
        return { err: new HttpApiError(HttpError.BAD_REQUEST, ErrorCode.NO_DID) }
    }
    return {
        ok: {
            did,
            publicKey: wallet.publicKey,
            getEnrolmentState: async () => {
                // const doc = await iam.getDidDocument()
                console.log('pre-claims')
                const { ok: claims, err: fetchError } = await fetchClaims(iam, did)
                console.log('claims', claims, fetchError)
                if (!claims) {
                    return { err: fetchError }
                }
                // cycle through claims to get overall enrolment status
                const state = {
                    user: RoleStatus.NO_CLAIM,
                    messagebroker: RoleStatus.NO_CLAIM
                }
                for (const { claimType, isAccepted } of claims) {
                    if (claimType === MESSAGEBROKER_ROLE) {
                        state.messagebroker = isAccepted
                            ? RoleStatus.APPROVED
                            : RoleStatus.AWAITING_APPROVAL
                    }
                    if (claimType === USER_ROLE) {
                        state.user = isAccepted
                            ? RoleStatus.APPROVED
                            : RoleStatus.AWAITING_APPROVAL
                    }
                }
                return { ok: state }
            },
            handleEnrolement: async (state: EnrolmentState) => {
                if (state.messagebroker === RoleStatus.NO_CLAIM) {
                    const { ok } = await createClaim(iam, MESSAGEBROKER_ROLE)
                    if (!ok) {
                        return { err: new HttpApiError(
                            HttpError.INTERNAL_SERVER_ERROR,
                            ErrorCode.CREATE_MESSAGEBROKER_CLAIM_FAILED)
                        }
                    }
                }
                if (state.user === RoleStatus.NO_CLAIM) {
                    const { ok } = await createClaim(iam, USER_ROLE)
                    if (!ok) {
                        return { err: new HttpApiError(
                            HttpError.INTERNAL_SERVER_ERROR,
                            ErrorCode.CREATE_USER_CLAIM_FAILED)
                        }
                    }
                }
                return { ok: true }
            },
            writeToFile: async () => {
                try {
                    await fs.writeFile(config.storage.inMemoryDbFile, JSON.stringify({
                        did: iam.getDid(),
                        address: wallet.address,
                        publicKey: wallet.publicKey,
                        privateKey: wallet.privateKey,
                    }, null, 2))
                    return { ok: true }
                } catch (err) {
                    return { err: new HttpApiError(
                        HttpError.INTERNAL_SERVER_ERROR,
                        ErrorCode.DISK_PERSIST_FAILED)
                    }
                }
            }
        }
    }
}

/**
 * Asserts whether a private key is valid
 *
 * @param privateKey string private key that the wallet should use
 * @returns the wallet initiated from private key
 */
function validatePrivateKey(privateKey: string): Result<Wallet, HttpApiError> {
    try {
        return { ok: new Wallet(privateKey) }
    } catch (err) {
        return {
            err: new HttpApiError(
                HttpError.BAD_REQUEST,
                ErrorCode.INVALID_PRIVATE_KEY)
        }
    }
}

/**
 * Initialze IAM Client Library
 *
 * @param privateKey the identity controlling to the DID
 * @returns initialized IAM object
 */
async function initIAM(privateKey: string): Promise<Result<IAM, HttpApiError>> {
    try {
        const iam = new IAM({
            privateKey,
            rpcUrl: config.iam.rpcUrl,
        })
        // todo: create DID
        console.log('pre-init', iam.getDid())
        await iam.initializeConnection()
        console.log('init', iam.getDid())

        setCacheClientOptions(
            config.iam.chainId,
            {
                url: config.iam.cacheServerUrl
            }
        )
        return { ok: iam }
    } catch (err) {
        console.log(`Failed to init IAM: ${err.message}`)
        return {
            err: new HttpApiError(
                HttpError.INTERNAL_SERVER_ERROR,
                ErrorCode.IAM_INIT_ERROR)
        }
    }
}

/**
 * Fetch all claims under PARENT_NAMESPACE
 *
 * @param iam initialized IAM object
 * @param did subject of the claims
 * @returns array of claims
 */
async function fetchClaims(iam: IAM, did: string): Promise<Result<Claim[], HttpApiError>> {
    try {
        const claims = (await iam.getClaimsBySubject({
            did,
            parentNamespace: PARENT_NAMESPACE,
        }))
        return { ok: claims }
    } catch (err) {
        console.log(`Failed to fetch claims for ${did}: ${err.message}`)
        return {
            err: new HttpApiError(
                HttpError.INTERNAL_SERVER_ERROR,
                ErrorCode.FETCH_CLAIMS_FAILED)
        }
    }
}

/**
 * Create a claim to enrol as a certain role
 *
 * @param iam initialized IAM object
 * @param claim the type of claim (messagebroker, user, etc.)
 * @returns ok (boolean)
 */
async function createClaim(iam: IAM, claim: string): Promise<Result> {
    try {
        await iam.createClaimRequest({
            claim: {
                claimType: claim,
                claimTypeVersion: 1,
                fields: []
            },
            registrationTypes: [
                RegistrationTypes.OnChain,
                RegistrationTypes.OffChain,
            ]
        })
        return { ok: true }
    } catch (err) {
        console.log(`Failed to create claim ${claim}: ${err.message}`)
        return { err }
    }
}
