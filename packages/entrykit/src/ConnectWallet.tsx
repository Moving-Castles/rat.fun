import { Button } from "./ui/Button"
import { useModal } from "connectkit"
import { AppInfo } from "./AppInfo"
import { twMerge } from "tailwind-merge"
import { useEffect, useRef } from "react"

export function ConnectWallet() {
  return (
    <div
      className={twMerge(
        "flex flex-col gap-6 p-6",
        "animate-in animate-duration-300 fade-in slide-in-from-bottom-8"
      )}
    >
      <div className="p-4">
        {/* TODO: render appImage if available? */}
        <AppInfo />
      </div>
      <div className="self-center flex flex-col gap-2 w-60">
        <WalletButton />
      </div>
    </div>
  )
}

function WalletButton() {
  const { open, setOpen } = useModal()
  const hasAutoOpenedRef = useRef(false)

  useEffect(() => {
    if (!open && !hasAutoOpenedRef.current) {
      setOpen(true)
      hasAutoOpenedRef.current = true
    }
  }, [open, setOpen])

  return (
    <>
      <Button
        key="create"
        variant="secondary"
        className="self-auto flex justify-center"
        onClick={() => setOpen(true)}
        autoFocus
      >
        Connect wallet
      </Button>
    </>
  )
}
