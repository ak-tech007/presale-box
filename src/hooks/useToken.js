//@ts-check
import { useCallback } from 'react'
import { erc20Abi, formatUnits } from 'viem'
import { useAccount, useBalance, useReadContracts } from 'wagmi'

export const useToken = () => {
  const tokenAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"
  const { address } = useAccount()
  const { data: native, refetch: refetchNative } = useBalance({
    address: address,
    chainId: 1,
  })

  const { data: token, refetch: refetchToken } = useReadContracts({
    allowFailure: true,
    contracts: [
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
        chainId: 1,
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
        chainId: 1,
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
        chainId: 1,
      },
    ],
  })
  

  const refetch = useCallback(() => {
    refetchNative()
    refetchToken()
  }, [refetchNative, refetchToken])

  return {
    nativeBalance: native?.value,
    tokenBalance : token?.[0]?.result,
    decimals: token?.[1]?.result ?? 18,
    nativeFormatted: formatUnits(native?.value ?? 0n, 18),
    tokenFormatted: formatUnits(token?.[0]?.result ?? 0n, token?.[1]?.result ?? 18),
    refetch,
  }
}
