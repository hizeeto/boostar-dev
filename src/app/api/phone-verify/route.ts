import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 휴대전화번호 인증 코드 전송
export async function POST(request: Request) {
  try {
    const { phone, action } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: '휴대전화번호가 필요합니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 전화번호 형식 정리 (한국 번호)
    const cleanedPhone = phone.replace(/-/g, '')
    const formattedPhone = `+82${cleanedPhone.slice(1)}` // 010 -> +8210

    if (action === 'send') {
      // 인증 코드 전송
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (error) {
        return NextResponse.json(
          { error: error.message || '인증 코드 전송에 실패했습니다.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '인증 코드가 전송되었습니다.',
      })
    } else if (action === 'verify') {
      const { code } = await request.json()

      if (!code) {
        return NextResponse.json(
          { error: '인증 코드가 필요합니다.' },
          { status: 400 }
        )
      }

      // 인증 코드 확인
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: 'sms',
      })

      if (error) {
        return NextResponse.json(
          { error: error.message || '인증 코드가 올바르지 않습니다.' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: '인증이 완료되었습니다.',
      })
    }

    return NextResponse.json(
      { error: '잘못된 요청입니다.' },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

