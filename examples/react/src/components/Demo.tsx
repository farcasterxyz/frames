'use client'

import sdk, {
  AddFrame,
  SignIn as SignInCore,
  type Context,
  type FrameNotificationDetails,
} from '@farcaster/frame-sdk'
import { getCsrfToken, signIn, signOut } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { Input } from '../components/ui/input'

import { createStore } from 'mipd'
import { useSession } from 'next-auth/react'
import { BaseError, UserRejectedRequestError } from 'viem'
import { base, optimism } from 'wagmi/chains'
import { config } from '~/components/providers/WagmiProvider'
import { Button } from '~/components/ui/Button'
import { Label } from '~/components/ui/label'
import { truncateAddress } from '~/lib/truncateAddress'

export default function Demo(
  { title }: { title?: string } = { title: 'Frames v2 Demo' },
) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)
  const [context, setContext] = useState<Context.FrameContext>()
  const [isContextOpen, setIsContextOpen] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const [added, setAdded] = useState(false)
  const [notificationDetails, setNotificationDetails] =
    useState<FrameNotificationDetails | null>(null)

  const [lastEvent, setLastEvent] = useState('')

  const [addFrameResult, setAddFrameResult] = useState('')
  const [sendNotificationResult, setSendNotificationResult] = useState('')

  useEffect(() => {
    setNotificationDetails(context?.client.notificationDetails ?? null)
  }, [context])

  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    })

  const {
    signTypedData,
    error: signTypedError,
    isError: isSignTypedError,
    isPending: isSignTypedPending,
  } = useSignTypedData()

  const { disconnect } = useDisconnect()
  const { connect } = useConnect()

  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain()

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: chainId === base.id ? optimism.id : base.id })
  }, [switchChain, chainId])

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context
      setContext(context)
      setAdded(context?.client.added)

      sdk.on('frameAdded', ({ notificationDetails }) => {
        setLastEvent(
          `frameAdded${notificationDetails ? ', notifications enabled' : ''}`,
        )

        setAdded(true)
        if (notificationDetails) {
          setNotificationDetails(notificationDetails)
        }
      })

      sdk.on('frameAddRejected', ({ reason }) => {
        setLastEvent(`frameAddRejected, reason ${reason}`)
      })

      sdk.on('frameRemoved', () => {
        setLastEvent('frameRemoved')
        setAdded(false)
        setNotificationDetails(null)
      })

      sdk.on('notificationsEnabled', ({ notificationDetails }) => {
        setLastEvent('notificationsEnabled')
        setNotificationDetails(notificationDetails)
      })
      sdk.on('notificationsDisabled', () => {
        setLastEvent('notificationsDisabled')
        setNotificationDetails(null)
      })

      sdk.on('primaryButtonClicked', () => {})
      sdk.actions.ready({})

      // Set up a MIPD Store, and request Providers.
      const store = createStore()

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      })
    }
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true)
      load()
      return () => {
        sdk.removeAllListeners()
      }
    }
  }, [isSDKLoaded])

  const openUrl = useCallback(() => {
    sdk.actions.openUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  }, [])

  const openWarpcastUrl = useCallback(() => {
    sdk.actions.openUrl('https://warpcast.com/~/compose')
  }, [])

  const close = useCallback(() => {
    sdk.actions.close()
  }, [])

  const addFrame = useCallback(async () => {
    try {
      setNotificationDetails(null)

      const result = await sdk.actions.addFrame()

      if (result.notificationDetails) {
        setNotificationDetails(result.notificationDetails)
      }
      setAddFrameResult(
        result.notificationDetails
          ? `Added, got notificaton token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
          : 'Added, got no notification details',
      )
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`)
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`)
      }

      setAddFrameResult(`Error: ${error}`)
    }
  }, [])

  const sendNotification = useCallback(async () => {
    setSendNotificationResult('')
    if (!notificationDetails || !context) {
      return
    }

    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        mode: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: context.user.fid,
          notificationDetails,
        }),
      })

      if (response.status === 200) {
        setSendNotificationResult('Success')
        return
      }
      if (response.status === 429) {
        setSendNotificationResult('Rate limited')
        return
      }

      const data = await response.text()
      setSendNotificationResult(`Error: ${data}`)
    } catch (error) {
      setSendNotificationResult(`Error: ${error}`)
    }
  }, [context, notificationDetails])

  const sendTx = useCallback(() => {
    sendTransaction(
      {
        // call yoink() on Yoink contract
        to: '0x4bBFD120d9f352A0BEd7a014bd67913a2007a878',
        data: '0x9846cd9efc000023c0',
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash)
        },
      },
    )
  }, [sendTransaction])

  const signTyped = useCallback(() => {
    signTypedData({
      domain: {
        name: 'Frames v2 Demo',
        version: '1',
        chainId,
      },
      types: {
        Message: [{ name: 'content', type: 'string' }],
      },
      message: {
        content: 'Hello from Frames v2!',
      },
      primaryType: 'Message',
    })
  }, [chainId, signTypedData])

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev)
  }, [])

  if (!isSDKLoaded) {
    return <div>Loading...</div>
  }

  return (
    <div
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>

        <div className="mb-4">
          <h2 className="font-2xl font-bold">Context</h2>
          <button
            type="button"
            onClick={toggleContext}
            className="flex items-center gap-2 transition-colors"
          >
            <span
              className={`transform transition-transform ${
                isContextOpen ? 'rotate-90' : ''
              }`}
            >
              ➤
            </span>
            Tap to expand
          </button>

          {isContextOpen && (
            <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                {JSON.stringify(context, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-2xl font-bold">Actions</h2>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.signIn
              </pre>
            </div>
            <SignIn />
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.openUrl
              </pre>
            </div>
            <Button onClick={openUrl}>Open Link</Button>
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.openUrl
              </pre>
            </div>
            <Button onClick={openWarpcastUrl}>Open Warpcast Link</Button>
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.viewProfile
              </pre>
            </div>
            <ViewProfile />
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.close
              </pre>
            </div>
            <Button onClick={close}>Close Frame</Button>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="font-2xl font-bold">Last event</h2>

          <div className="p-4 mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
              {lastEvent || 'none'}
            </pre>
          </div>
        </div>

        <div>
          <h2 className="font-2xl font-bold">Add to client & notifications</h2>

          <div className="mt-2 mb-4 text-sm">
            Client fid {context?.client.clientFid},
            {added ? ' frame added to client,' : ' frame not added to client,'}
            {notificationDetails
              ? ' notifications enabled'
              : ' notifications disabled'}
          </div>

          <div className="mb-4">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg my-2">
              <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-[260px] overflow-x-">
                sdk.actions.addFrame
              </pre>
            </div>
            {addFrameResult && (
              <div className="mb-2 text-sm">
                Add frame result: {addFrameResult}
              </div>
            )}
            <Button onClick={addFrame} disabled={added}>
              Add frame to client
            </Button>
          </div>

          {sendNotificationResult && (
            <div className="mb-2 text-sm">
              Send notification result: {sendNotificationResult}
            </div>
          )}
          <div className="mb-4">
            <Button onClick={sendNotification} disabled={!notificationDetails}>
              Send notification
            </Button>
          </div>
        </div>

        <div>
          <h2 className="font-2xl font-bold">Wallet</h2>

          {address && (
            <div className="my-2 text-xs">
              Address: <pre className="inline">{truncateAddress(address)}</pre>
            </div>
          )}

          {chainId && (
            <div className="my-2 text-xs">
              Chain ID: <pre className="inline">{chainId}</pre>
            </div>
          )}

          <div className="mb-4">
            <Button
              onClick={() =>
                isConnected
                  ? disconnect()
                  : connect({ connector: config.connectors[0] })
              }
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>

          <div className="mb-4">
            <SignMessage />
          </div>

          {isConnected && (
            <>
              <div className="mb-4">
                <SendEth />
              </div>
              <div className="mb-4">
                <Button
                  onClick={sendTx}
                  disabled={!isConnected || isSendTxPending}
                  isLoading={isSendTxPending}
                >
                  Send Transaction (contract)
                </Button>
                {isSendTxError && renderError(sendTxError)}
                {txHash && (
                  <div className="mt-2 text-xs">
                    <div>Hash: {truncateAddress(txHash)}</div>
                    <div>
                      Status:{' '}
                      {isConfirming
                        ? 'Confirming...'
                        : isConfirmed
                          ? 'Confirmed!'
                          : 'Pending'}
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <Button
                  onClick={signTyped}
                  disabled={!isConnected || isSignTypedPending}
                  isLoading={isSignTypedPending}
                >
                  Sign Typed Data
                </Button>
                {isSignTypedError && renderError(signTypedError)}
              </div>
              <div className="mb-4">
                <Button
                  onClick={handleSwitchChain}
                  disabled={isSwitchChainPending}
                  isLoading={isSwitchChainPending}
                >
                  Switch to {chainId === base.id ? 'Optimism' : 'Base'}
                </Button>
                {isSwitchChainError && renderError(switchChainError)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SignMessage() {
  const { isConnected } = useAccount()
  const { connectAsync } = useConnect()
  const {
    signMessage,
    data: signature,
    error: signError,
    isError: isSignError,
    isPending: isSignPending,
  } = useSignMessage()

  const handleSignMessage = useCallback(async () => {
    if (!isConnected) {
      await connectAsync({
        chainId: base.id,
        connector: config.connectors[0],
      })
    }

    signMessage({ message: 'Hello from Frames v2!' })
  }, [connectAsync, isConnected, signMessage])

  return (
    <>
      <Button
        onClick={handleSignMessage}
        disabled={isSignPending}
        isLoading={isSignPending}
      >
        Sign Message
      </Button>
      {isSignError && renderError(signError)}
      {signature && (
        <div className="mt-2 text-xs">
          <div>Signature: {signature}</div>
        </div>
      )}
    </>
  )
}

function SendEth() {
  const { isConnected, chainId } = useAccount()
  const {
    sendTransaction,
    data,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: data,
    })

  const toAddr = useMemo(() => {
    // Protocol guild address
    return chainId === base.id
      ? '0x32e3C7fD24e175701A35c224f2238d18439C7dBC'
      : '0xB3d8d7887693a9852734b4D25e9C0Bb35Ba8a830'
  }, [chainId])

  const handleSend = useCallback(() => {
    sendTransaction({
      to: toAddr,
      value: 1n,
    })
  }, [toAddr, sendTransaction])

  return (
    <>
      <Button
        onClick={handleSend}
        disabled={!isConnected || isSendTxPending}
        isLoading={isSendTxPending}
      >
        Send Transaction (eth)
      </Button>
      {isSendTxError && renderError(sendTxError)}
      {data && (
        <div className="mt-2 text-xs">
          <div>Hash: {truncateAddress(data)}</div>
          <div>
            Status:{' '}
            {isConfirming
              ? 'Confirming...'
              : isConfirmed
                ? 'Confirmed!'
                : 'Pending'}
          </div>
        </div>
      )}
    </>
  )
}

function SignIn() {
  const [signingIn, setSigningIn] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signInResult, setSignInResult] = useState<SignInCore.SignInResult>()
  const [signInFailure, setSignInFailure] = useState<string>()
  const { data: session, status } = useSession()

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken()
    if (!nonce) throw new Error('Unable to generate nonce')
    return nonce
  }, [])

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true)
      setSignInFailure(undefined)
      const nonce = await getNonce()
      const result = await sdk.actions.signIn({ nonce })
      setSignInResult(result)

      await signIn('credentials', {
        message: result.message,
        signature: result.signature,
        redirect: false,
      })
    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure('Rejected by user')
        return
      }

      setSignInFailure('Unknown error')
    } finally {
      setSigningIn(false)
    }
  }, [getNonce])

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true)
      await signOut({ redirect: false })
      setSignInResult(undefined)
    } finally {
      setSigningOut(false)
    }
  }, [])

  return (
    <>
      {status !== 'authenticated' && (
        <Button onClick={handleSignIn} disabled={signingIn}>
          Sign In with Farcaster
        </Button>
      )}
      {status === 'authenticated' && (
        <Button onClick={handleSignOut} disabled={signingOut}>
          Sign out
        </Button>
      )}
      {session && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">Session</div>
          <div className="whitespace-pre">
            {JSON.stringify(session, null, 2)}
          </div>
        </div>
      )}
      {signInFailure && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">{signInFailure}</div>
        </div>
      )}
      {signInResult && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-gray-100 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">
            {JSON.stringify(signInResult, null, 2)}
          </div>
        </div>
      )}
    </>
  )
}

function ViewProfile() {
  const [fid, setFid] = useState('3')

  return (
    <>
      <div>
        <Label
          className="text-xs font-semibold text-gray-500 mb-1"
          htmlFor="view-profile-fid"
        >
          Fid
        </Label>
        <Input
          id="view-profile-fid"
          type="number"
          value={fid}
          className="mb-2"
          onChange={(e) => {
            setFid(e.target.value)
          }}
          step="1"
          min="1"
        />
      </div>
      <Button
        onClick={() => {
          sdk.actions.viewProfile({ fid: Number.parseInt(fid) })
        }}
      >
        View Profile
      </Button>
    </>
  )
}

const renderError = (error: Error | null) => {
  if (!error) return null
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError,
    )

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>
}
