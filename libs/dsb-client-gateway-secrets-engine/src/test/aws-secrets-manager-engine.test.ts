import {
  CreateSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  ResourceNotFoundException,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { ConfigService } from '@nestjs/config';
import { AwsSecretsManagerService } from '../lib/service/aws-secrets-manager.service';
import { mockClient } from 'aws-sdk-client-mock';

describe('Secrets Manager Engine', () => {
  const service = new AwsSecretsManagerService(new ConfigService());

  beforeAll(async () => {
    await service.onModuleInit();
  });

  it('should get an RSA Private Key', async () => {
    const smMockClient = mockClient(SecretsManagerClient);
    const SecretString = 'test_rsa_key';

    smMockClient.on(GetSecretValueCommand).resolves({
      Name: '/dsb-gw/rsa_key',
      SecretString,
    });

    const key = await service.getRSAPrivateKey();
    expect(key).toBeDefined();
    expect(key).toEqual(SecretString);
  });

  it('should create an RSA Private Key if it does not exist', async () => {
    const smMockClient = mockClient(SecretsManagerClient);

    smMockClient
      .on(PutSecretValueCommand)
      .rejects(
        new ResourceNotFoundException({ Message: 'test', $metadata: {} })
      );
    smMockClient.on(CreateSecretCommand).resolves({
      Name: '/dsb-gw/rsa_key',
    });

    const key = await service.setRSAPrivateKey('test key');
    expect(key).toBeDefined();
    if (key && key.Name) {
      expect(key.Name).toEqual('/dsb-gw/rsa_key');
    }
  });

  it('should update an existing RSA Private Key', async () => {
    const smMockClient = mockClient(SecretsManagerClient);

    smMockClient.on(PutSecretValueCommand).resolves({
      Name: '/dsb-gw/rsa_key',
    });

    const key = await service.setRSAPrivateKey('test key');
    expect(key).toBeDefined();
    if (key && key.Name) {
      expect(key.Name).toEqual('/dsb-gw/rsa_key');
    }
  });

  it('should get a Private Identity Key', async () => {
    const smMockClient = mockClient(SecretsManagerClient);
    const SecretString = 'test_identity_key';

    smMockClient.on(GetSecretValueCommand).resolves({
      Name: '/dsb-gw/identity/private_key',
      SecretString,
    });

    const key = await service.getPrivateKey();
    expect(key).toBeDefined();
    expect(key).toEqual(SecretString);
  });

  it('should create a Private Identity Key if it does not exist', async () => {
    const smMockClient = mockClient(SecretsManagerClient);

    smMockClient
      .on(PutSecretValueCommand)
      .rejects(
        new ResourceNotFoundException({ Message: 'test', $metadata: {} })
      );
    smMockClient.on(CreateSecretCommand).resolves({
      Name: '/dsb-gw/identity/private_key',
    });

    const key = await service.setPrivateKey('test key');
    expect(key).toBeDefined();
    if (key && key.Name) {
      expect(key.Name).toEqual('/dsb-gw/identity/private_key');
    }
  });

  it('should update a Private Identity Key', async () => {
    const smMockClient = mockClient(SecretsManagerClient);

    smMockClient.on(PutSecretValueCommand).resolves({
      Name: '/dsb-gw/identity/private_key',
    });

    const key = await service.setPrivateKey('test key');
    expect(key).toBeDefined();
    if (key && key.Name) {
      expect(key.Name).toEqual('/dsb-gw/identity/private_key');
    }
  });

  it('should get an Encryption Keys secret', async () => {
    const smMockClient = mockClient(SecretsManagerClient);
    const SecretString = JSON.stringify({
      encryption_key: 'test_encryption_key',
    });

    smMockClient.on(GetSecretValueCommand).resolves({
      Name: '/dsb-gw/keys',
      SecretString,
    });

    const key = await service.getEncryptionKeys();
    expect(key).toBeDefined();
    expect(key).toEqual(JSON.parse(SecretString));
  });

  it('should create an Encryption Keys secret if it does not exist', async () => {
    const smMockClient = mockClient(SecretsManagerClient);

    smMockClient
      .on(PutSecretValueCommand)
      .rejects(
        new ResourceNotFoundException({ Message: 'test', $metadata: {} })
      );
    smMockClient.on(CreateSecretCommand).resolves({
      Name: '/dsb-gw/keys',
    });
    const key = await service.setEncryptionKeys({
      privateDerivedKey: 'test_private_derived_key',
      privateMasterKey: 'test_private_master_key',
      publicMasterKey: 'test_public_master_key',
      createdAt: 'test_created_at',
    });
    expect(key).toBeDefined();
    if (key && key.Name) {
      expect(key.Name).toEqual('/dsb-gw/keys');
    }
  });

  it('should update an Encryption Keys secret', async () => {
    const smMockClient = mockClient(SecretsManagerClient);

    smMockClient.on(PutSecretValueCommand).resolves({
      Name: '/dsb-gw/keys',
    });

    const key = await service.setEncryptionKeys({
      privateDerivedKey: 'test_private_derived_key',
      privateMasterKey: 'test_private_master_key',
      publicMasterKey: 'test_public_master_key',
      createdAt: 'test_created_at',
    });
    expect(key).toBeDefined();
    if (key && key.Name) {
      expect(key.Name).toEqual('/dsb-gw/keys');
    }
  });

  it('should get Certificate Details secret', async () => {
    const smMockClient = mockClient(SecretsManagerClient);

    const testData = {
      privateKey: {
        Name: '/dsb-gw/certificate/private_key',
        SecretString: 'test_private_key',
      },
      certificate: {
        Name: '/dsb-gw/certificate/certificate',
        SecretString: 'test_certificate',
      },
      caCertificate: {
        Name: '/dsb-gw/certificate/ca_certificate',
        SecretString: 'test_ca_certificate',
      },
    };

    smMockClient
      .on(GetSecretValueCommand)
      .resolvesOnce({
        Name: testData.privateKey.SecretString,
        SecretString: testData.privateKey.SecretString,
      })
      .resolvesOnce({
        Name: testData.certificate.SecretString,
        SecretString: testData.certificate.SecretString,
      })
      .resolvesOnce({
        Name: testData.caCertificate.SecretString,
        SecretString: testData.caCertificate.SecretString,
      });
    const details = await service.getCertificateDetails();
    expect(details).toBeDefined();
    for (const key in details) {
      expect(details[key]).toBeDefined();
      expect(details[key]).toEqual(testData[key].SecretString);
    }
  });

  it('should create a Certificate Details secret if it does not exist', async () => {
    const smMockClient = mockClient(SecretsManagerClient);

    smMockClient
      .on(PutSecretValueCommand)
      .rejectsOnce(
        new ResourceNotFoundException({ Message: 'test', $metadata: {} })
      )
      .rejectsOnce(
        new ResourceNotFoundException({ Message: 'test', $metadata: {} })
      )
      .rejectsOnce(
        new ResourceNotFoundException({ Message: 'test', $metadata: {} })
      );
    smMockClient
      .on(CreateSecretCommand)
      .resolvesOnce({
        Name: '/dsb-gw/certificate/private_key',
      })
      .resolvesOnce({
        Name: '/dsb-gw/certificate/certificate',
      })
      .resolvesOnce({
        Name: '/dsb-gw/certificate/ca_certificate',
      });

    const details = await service.setCertificateDetails({
      privateKey: 'test_private_key',
      certificate: 'test_certificate',
      caCertificate: 'test_ca_certificate',
    });
    console.log(details);
    expect(details).toBeDefined();
    if (details && details.length) {
      for (const cert of details) {
        expect(cert.Name).toMatch(RegExp('^/dsb-gw/certificate/?'));
      }
    }
  });

  it('should update Certificate Details secret', async () => {
    const smMockClient = mockClient(SecretsManagerClient);

    smMockClient
      .on(PutSecretValueCommand)
      .resolvesOnce({
        Name: '/dsb-gw/certificate/private_key',
      })
      .resolvesOnce({
        Name: '/dsb-gw/certificate/certificate',
      })
      .resolvesOnce({
        Name: '/dsb-gw/certificate/ca_certificate',
      });

    const details = await service.setCertificateDetails({
      privateKey: 'test_private_key',
      certificate: 'test_certificate',
      caCertificate: 'test_ca_certificate',
    });
    expect(details).toBeDefined();
    if (details && details.length) {
      for (const cert of details) {
        expect(cert.Name).toMatch(RegExp('^/dsb-gw/certificate/?'));
      }
    }
  });
});
