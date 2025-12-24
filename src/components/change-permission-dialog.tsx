"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldLabel,
} from "@/components/ui/field"
import { toast } from "@/lib/toast"

type Permission = "소유자" | "관리자" | "멤버"

type ChangePermissionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPermission: Permission
  onConfirm: (permission: Permission) => Promise<void>
  memberName: string
}

// 권한을 DB의 permission 값으로 변환
const mapRoleToPermission = (role: Permission): "전체 권한" | "편집 권한" | "조회 권한" => {
  switch (role) {
    case "소유자":
      return "전체 권한"
    case "관리자":
      return "편집 권한"
    case "멤버":
      return "조회 권한"
  }
}

export function ChangePermissionDialog({
  open,
  onOpenChange,
  currentPermission,
  onConfirm,
  memberName,
}: ChangePermissionDialogProps) {
  const [selectedPermission, setSelectedPermission] = useState<Permission>(currentPermission)
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedPermission(currentPermission)
    }
  }, [open, currentPermission])

  const handleConfirm = async () => {
    try {
      setIsChanging(true)
      await onConfirm(selectedPermission)
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "권한 변경에 실패했습니다")
    } finally {
      setIsChanging(false)
    }
  }

  const handleClose = () => {
    setSelectedPermission(currentPermission)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>권한 변경</DialogTitle>
          <DialogDescription>
            {memberName}님의 권한을 변경합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Field>
            <FieldLabel>권한</FieldLabel>
            <Select
              value={selectedPermission}
              onValueChange={(value: Permission) => setSelectedPermission(value)}
              disabled={isChanging}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="소유자">소유자</SelectItem>
                <SelectItem value="관리자">관리자</SelectItem>
                <SelectItem value="멤버">멤버</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isChanging}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isChanging || selectedPermission === currentPermission}
          >
            {isChanging ? "변경 중..." : "변경"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

