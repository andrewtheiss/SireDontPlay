import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import './App.css'

const CONTRACT_ADDRESS = '0xe2bbd2d3f20d5f9abce2933cc5b9e7b7e307b843'

// Simple ERC721/ERC1155 mint ABI - you may need to adjust this based on your contract
const MINT_ABI = [
  {
    "inputs": [],
    "name": "mint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
]

function App() {
  const { address, isConnected } = useAccount()
  const [mintPrice] = useState('0.0008') // Updated to match the image
  const [totalMinted, setTotalMinted] = useState(0)
  const [timeLeft, setTimeLeft] = useState({
    days: 6,
    hours: 13,
    minutes: 41,
    seconds: 47
  })
  
  const { 
    writeContract, 
    data: hash,
    isPending: isMintPending,
    error: mintError 
  } = useWriteContract()

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash,
  })

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

  const handleMint = async () => {
    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: MINT_ABI,
        functionName: 'mint',
        value: parseEther(mintPrice),
      })
    } catch (error) {
      console.error('Mint failed:', error)
    }
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="app">
      <div className="container">
        {/* Left Panel */}
        <div className="left-panel">
          <div className="header">
            <h1>Diamond Hands</h1>
            <div className="user-badge">
              <div className="avatar"></div>
              <span className="address">{isConnected ? formatAddress(address) : '0xb5b...6500'}</span>
              <button className="subscribe-btn">SUBSCRIBE</button>
            </div>
          </div>

          <div className="content">
            <h2 className="tagline">WE NEVER LEFT</h2>
            
            <p className="description">
              Diamond Hands is available on all major music streaming platforms. 
              You can also mint this music NFT to support Muzuki rapper SireDontPlay 
              & producer Cmuney. This is the second release in Sounds of the Garden 
              (A music NFT collection by the Garden, for the Garden)
            </p>

            <div className="artist-tag">IIKZ</div>

            <div className="media-preview">
              <div className="thumbnail">
                <div className="play-icon">▶</div>
              </div>
              <div className="media-info">
                <h3>Diamond Hands by SireDontPlay</h3>
                <button className="watch-btn">WATCH NOW</button>
              </div>
            </div>

            <div className="mint-info">
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">MINT PRICE</span>
                  <span className="value">{mintPrice} ETH</span>
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

              {!isConnected ? (
                <div className="connect-section">
                  <w3m-button />
                  <p className="connect-help">Connect your wallet to mint</p>
                </div>
              ) : (
                <button
                  className="buy-button"
                  onClick={handleMint}
                  disabled={isMintPending || isConfirming}
                >
                  {isMintPending ? 'PREPARING...' : 
                   isConfirming ? 'CONFIRMING...' : 
                   `BUY NOW • ${mintPrice} ETH`}
                </button>
              )}

              {mintError && (
                <div className="error">
                  Error: {mintError.shortMessage || mintError.message}
                </div>
              )}

              {isConfirmed && (
                <div className="success">
                  🎉 Mint successful! 
                  <a 
                    href={`https://etherscan.io/tx/${hash}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    View on Etherscan
                  </a>
                </div>
              )}

              <details className="view-details">
                <summary>VIEW DETAILS</summary>
                <div className="details-content">
                  <p><strong>Contract:</strong> {CONTRACT_ADDRESS}</p>
                  <p><strong>Standard:</strong> ERC-1155</p>
                  <p><strong>Blockchain:</strong> Ethereum</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Right Panel - Artwork */}
        <div className="right-panel">
          <div className="artwork-container">
            <img 
              src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop&crop=center" 
              alt="Diamond Hands NFT"
              className="artwork"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
