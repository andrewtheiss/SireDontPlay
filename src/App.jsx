import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import './App.css'
import nftData from './file.json'
import contractABI from './ArtEdition.json'

// Contract configuration
const CONTRACT_ADDRESS = '0xe2bbd2d3f20d5f9abce2933cc5b9e7b7e307b843'
const ANIME_COIN_ADDRESS = '0x37a645648dF29205C6261289983FB04ECD70b4B3'

// Standard ERC20 ABI for approval and balance checks
const ERC20_ABI = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)'
]

// Arbitrum One Chain Configuration
const ARBITRUM_CHAIN_ID = '0xa4b1' // 42161
const ARBITRUM_NETWORK_PARAMS = {
  chainId: ARBITRUM_CHAIN_ID,
  chainName: 'Arbitrum One',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://arbiscan.io/'],
}

function App() {
  const [address, setAddress] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isOnCorrectNetwork, setIsOnCorrectNetwork] = useState(false)
  const [mintPrice, setMintPrice] = useState('0')
  const [tokenSymbol, setTokenSymbol] = useState('ANIME')
  const [tokenDecimals, setTokenDecimals] = useState(18)
  const [totalMinted, setTotalMinted] = useState(0)
  const [timeLeft, setTimeLeft] = useState({
    days: 6,
    hours: 13,
    minutes: 41,
    seconds: 47
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [contract, setContract] = useState(null)
  const audioRef = useRef(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [userTokenBalance, setUserTokenBalance] = useState('0')
  
  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum) throw new Error('MetaMask is not installed.')

    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })

    if (currentChainId === ARBITRUM_CHAIN_ID) {
      setIsOnCorrectNetwork(true)
      setError('')
      return true
    }

    setIsOnCorrectNetwork(false)
    setError('Wrong network. Please switch to Arbitrum One.')
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARBITRUM_CHAIN_ID }],
      })
      setIsOnCorrectNetwork(true)
      setError('')
      return true
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ARBITRUM_NETWORK_PARAMS],
          })
          setIsOnCorrectNetwork(true)
          setError('')
          return true
        } catch (addError) {
          console.error('Failed to add Arbitrum network:', addError)
          setError('Failed to add Arbitrum One network to MetaMask.')
          return false
        }
      }
      console.error('Failed to switch network:', switchError)
      setError('Failed to switch network. Please do it manually in MetaMask.')
      return false
    }
  }

  // Combined initialization and data fetching effect
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const editionContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)
        setContract(editionContract)
        
        const tokenContract = new ethers.Contract(ANIME_COIN_ADDRESS, ERC20_ABI, provider)

        try {
          // Fetch token details
          const [symbol, decimals] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.decimals()
          ])
          setTokenSymbol(symbol)
          setTokenDecimals(Number(decimals))

          // Fetch sale info and format price
          const editionInfo = await editionContract.getEditionInfo()
          const rawPrice = editionInfo[0] // Assuming first value is price for ERC20 sale
          setMintPrice(ethers.formatUnits(rawPrice, Number(decimals)))
          setTotalMinted(Number(editionInfo[1]))

        } catch (err) {
          console.error('Error fetching contract data:', err)
          setError('Could not load contract details.')
        }
      }
    }
    init()
  }, [])
  
  // Effect to check balance and allowance when user or network changes
  useEffect(() => {
    const checkBalanceAndAllowance = async () => {
      if (isConnected && isOnCorrectNetwork && contract) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const tokenContract = new ethers.Contract(ANIME_COIN_ADDRESS, ERC20_ABI, provider)
        
        try {
          // Check balance
          const balance = await tokenContract.balanceOf(address)
          setUserTokenBalance(ethers.formatUnits(balance, tokenDecimals))
          
          // Check allowance
          const allowance = await tokenContract.allowance(address, CONTRACT_ADDRESS)
          const priceWei = ethers.parseUnits(mintPrice, tokenDecimals)

          if (allowance < priceWei) {
            setNeedsApproval(true)
          } else {
            setNeedsApproval(false)
          }
        } catch (err) {
          console.error("Failed to check balance or allowance:", err)
        }
      }
    }
    checkBalanceAndAllowance()
  }, [isConnected, isOnCorrectNetwork, address, contract, mintPrice, tokenDecimals])

  // Effect to handle account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
        } else {
          setAddress('')
          setIsConnected(false)
        }
      }

      const handleChainChanged = (chainId) => {
        if (chainId.toLowerCase() === ARBITRUM_CHAIN_ID.toLowerCase()) {
            setIsOnCorrectNetwork(true)
            setError('')
        } else {
            setIsOnCorrectNetwork(false)
            setError('Wrong network. Please switch to Arbitrum One.')
        }
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      // Initial check for connected accounts
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setAddress(accounts[0])
            setIsConnected(true)
          }
        }).catch(console.error)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev
        
        if (seconds > 0) {
          seconds--
        } else if (minutes > 0) {
          minutes--
          seconds = 59
        } else if (hours > 0) {
          hours--
          minutes = 59
          seconds = 59
        } else if (days > 0) {
          days--
          hours = 23
          minutes = 59
          seconds = 59
        }
        
        return { days, hours, minutes, seconds }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Add debug logging for attributes
  useEffect(() => {
    console.log('NFT Data:', nftData);
    console.log('Attributes:', nftData.attributes);
  }, []);

  const connectWallet = async () => {
    try {
      setIsConnecting(true)
      setError('')

      const isCorrectNetwork = await checkAndSwitchNetwork()
      if (!isCorrectNetwork) {
        throw new Error('Please connect to the Arbitrum One network to proceed.')
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts.length === 0) throw new Error('No accounts found.')
      
      setAddress(accounts[0])
      setIsConnected(true)

    } catch (err) {
      console.error('Connection error:', err)
      setError(err.message || 'Failed to connect wallet.')
      throw err
    } finally {
      setIsConnecting(false)
    }
  }

  const handleApprove = async () => {
    if (!contract) return
    try {
      setIsApproving(true)
      setError('')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const tokenContract = new ethers.Contract(ANIME_COIN_ADDRESS, ERC20_ABI, signer)
      
      const priceWei = ethers.parseUnits(mintPrice, tokenDecimals)
      const tx = await tokenContract.approve(CONTRACT_ADDRESS, priceWei)
      await tx.wait()
      
      setNeedsApproval(false)
      setSuccess('Approval successful! You can now mint.')

    } catch (err) {
      console.error('Approval failed:', err)
      setError('Failed to approve token. Please try again.')
    } finally {
      setIsApproving(false)
    }
  }

  const handleMintClick = async () => {
    try {
      setIsMinting(true)
      setError('')
      setSuccess('')
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contractWithSigner = contract.connect(signer)
      
      const tx = await contractWithSigner.mintERC20(1) // Assuming amount is 1
      await tx.wait()
      
      setSuccess(`🎉 Mint successful! View on Arbiscan: https://arbiscan.io/tx/${tx.hash}`)
      
      const editionInfo = await contract.getEditionInfo()
      setTotalMinted(Number(editionInfo[1]))

    } catch (err) {
      console.error('Mint error:', err)
      if (err.code === 4001) {
        setError('Transaction rejected by user.')
      } else {
        setError(err.message || 'Failed to mint. Please try again.')
      }
    } finally {
      setIsMinting(false)
    }
  }

  const handlePrimaryAction = async () => {
    // 1. Connect wallet if not connected
    if (!isConnected) {
      await connectWallet()
      return
    }
    // 2. Switch network if on wrong one
    if (!isOnCorrectNetwork) {
      await checkAndSwitchNetwork()
      return
    }
    // 3. Approve if needed
    if (needsApproval) {
      await handleApprove()
      return
    }
    // 4. Mint
    await handleMintClick()
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getMediaFiles = () => {
    return nftData.properties?.files || []
  }

  const getMediaByType = (type) => {
    const files = getMediaFiles()
    return files.find(file => file.type.startsWith(type))
  }

  const getMediaPreview = () => {
    const imageFile = getMediaByType('image')
    const audioFile = getMediaByType('audio')
    const videoFile = getMediaByType('video')

    switch (currentMediaType) {
      case 'audio':
        if (audioFile) {
          return (
            <audio controls className="media-player">
              <source src={audioFile.cdn_uri || audioFile.uri} type={audioFile.type} />
              Your browser does not support the audio element.
            </audio>
          )
        }
        break
      case 'video':
        if (videoFile) {
          return (
            <video controls className="media-player">
              <source src={videoFile.cdn_uri || videoFile.uri} type={videoFile.type} />
              Your browser does not support the video element.
            </video>
          )
        }
        break
      case 'youtube':
        if (nftData.youtube_url) {
          const videoId = nftData.youtube_url.split('v=')[1]?.split('&')[0]
          return (
            <iframe 
              width="100%" 
              height="200" 
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0" 
              allowFullScreen
              className="media-player"
            ></iframe>
          )
        }
        break
      default:
        return (
          <div className="thumbnail">
            <div className="play-icon">▶</div>
          </div>
        )
    }
  }

  const hasAudio = getMediaByType('audio')
  const hasVideo = getMediaByType('video')
  const hasYoutube = nftData.youtube_url

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const getButtonText = () => {
    if (!address) return 'CONNECT WALLET'
    if (!isOnCorrectNetwork) return 'SWITCH TO ARBITRUM ONE'
    if (needsApproval) return isApproving ? 'APPROVING...' : `APPROVE ${tokenSymbol}`
    if (isMinting) return 'MINTING...'
    return `MINT NOW • ${mintPrice} ${tokenSymbol}`
  }

  return (
    <div className="app">
      <div className="container">
        {/* Left Panel */}
        <div className="left-panel">
          <div className="header">
            <h1>{nftData.name}</h1>
            {isConnected && (
              <div className="user-badge">
                <div className="avatar"></div>
                <span className="address">{formatAddress(address)}</span>
              </div>
            )}
          </div>

          <div className="content">
            <h2 className="tagline">WE NEVER LEFT</h2>
            
            <p className="description">
              {nftData.description}
            </p>

            <div className="artist-tag">IIKZ</div>

            {/* Debug render for attributes */}
            <div style={{color: 'white', marginBottom: '10px'}}>
              Debug: {nftData.attributes ? `Found ${nftData.attributes.length} attributes` : 'No attributes found'}
            </div>

            {/* NFT Attributes */}
            {nftData.attributes && nftData.attributes.length > 0 && (
              <div className="nft-attributes">
                <h3>Traits</h3>
                <div className="attributes-grid">
                  {nftData.attributes.map((attribute, index) => (
                    <div key={index} className="attribute-item">
                      <span className="trait-type">{attribute.trait_type}</span>
                      <span className="trait-value">{attribute.value}</span>
                      {attribute.rarity && (
                        <span className="trait-rarity">{attribute.rarity}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mint-info">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">MINT PRICE</span>
                  <span className="value">{mintPrice} {tokenSymbol}</span>
                </div>
                <div className="info-item">
                  <span className="label">TOTAL MINTED</span>
                  <span className="value">{totalMinted}</span>
                </div>
                <div className="info-item">
                  <span className="label">TYPE</span>
                  <span className="value">OPEN EDITION</span>
                </div>
              </div>

              <div className="countdown">
                <span className="countdown-label">CLOSES IN</span>
                <div className="countdown-timer">
                  <div className="time-unit">
                    <span className="number">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="unit">DAYS</span>
                  </div>
                  <div className="time-unit">
                    <span className="number">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="unit">HOURS</span>
                  </div>
                  <div className="time-unit">
                    <span className="number">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="unit">MINUTES</span>
                  </div>
                  <div className="time-unit">
                    <span className="number">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="unit">SECONDS</span>
                  </div>
                </div>
              </div>

              <button
                className="buy-button"
                onClick={handlePrimaryAction}
                disabled={isMinting || isConnecting || isApproving}
              >
                {getButtonText()}
              </button>

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              {success && (
                <div className="success">
                  {success}
                </div>
              )}

              <details className="view-details">
                <summary>VIEW DETAILS</summary>
                <div className="details-content">
                  <p><strong>Contract:</strong> {CONTRACT_ADDRESS}</p>
                  <p><strong>Standard:</strong> ERC-1155</p>
                  <p><strong>Blockchain:</strong> Arbitrum One</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Right Panel - Artwork with Audio Player */}
        <div className="right-panel">
          <div 
            className="artwork-container"
            style={{
              backgroundImage: `url(${nftData.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="audio-overlay">
              <button 
                className={`play-button ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                <span className="play-icon"></span>
              </button>
              <audio 
                ref={audioRef} 
                src={nftData.properties?.audio_url || nftData.animation_url}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
