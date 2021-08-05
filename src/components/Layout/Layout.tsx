import React from 'react';
import Head from 'next/head';
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import { makeStyles } from '@material-ui/styles'
import {
  Typography,
  Container,
  Divider,
  Theme,
  Grid,
  Link
} from '@material-ui/core'
import { config } from 'config';
import { getHealth } from 'services/dsb.service';
import { getStorage } from 'services/storage.service';
import { Header } from './components/Header/Header';


export async function getServerSideProps(context: GetServerSidePropsContext) {
    const health = await getHealth()
    const state = await getStorage()
    console.log('health', health, 'state', state)
    return {
      props: {
        baseUrl: config.dsb.baseUrl,
        health,
        state
      }
    }
}

ty

export default function Layout({ baseUrl, health, state }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const classes = useStyles()
  
    return (
        <>
            <Head>
                <title>EW-DSB Client Gateway</title>
                <meta name="description" content="EW-DSB Client Gateway" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
 
            <main>
                <Header />

                <Container maxWidth="md">
                    <section className={classes.connectionStatus}>
                        <Typography variant="h4">Connection Status </Typography>
                        <Typography variant="caption" className={classes.connectionStatusPaper}>
                            { health.ok ? 'ONLINE' : `ERROR [${health.err}]` }
                        </Typography>
                    </section>

                </Container>
            </main>
        </>
    )
}

const useStyles = makeStyles((theme: Theme) => ({
    connectionStatus: {
      display: 'flex',
      alignItems: 'center',
      padding: '0 1rem',
  
      '& *': {
        color: '#fff'
      },
      marginBottom: '2rem'
    },
    connectionStatusPaper: {
      padding: '.5rem 1rem',
      marginLeft: '1rem',
      background: theme.palette.secondary.main,
      borderRadius: '1rem',
      display: 'flex',
      alignItems: 'center'
    },
    divider: {
      background: '#fff'
    },
    swagger: {
      margin: '2rem 0',
      padding: '0 2rem',
  
      '& a': {
        color: '#fff',
        fontSize: '2.1rem',
        textDecoration: 'underline'
      }
    },
    main: {
      padding: '0 1rem',
      marginTop: '2rem'
    }
}))
  