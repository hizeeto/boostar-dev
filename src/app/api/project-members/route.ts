import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { DEMO_USER_ID } from '@/lib/demo-session'

// 프로젝트 멤버 추가 API
export async function POST(request: Request) {
  try {
    const { projectId, userId, role, permission } = await request.json()

    if (!projectId || !userId || !role || !permission) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const cookieStore = await cookies()

    // 데모 사용자 확인
    const demoUserCookie = cookieStore.get('boostar_demo_user')
    const isDemoUser = demoUserCookie?.value === DEMO_USER_ID

    // 현재 사용자 인증 확인
    let currentUserId: string | null = null
    
    if (isDemoUser) {
      // 데모 사용자 모드
      currentUserId = DEMO_USER_ID
      console.log('[프로젝트 멤버 API] 데모 사용자 모드:', currentUserId)
    } else {
      // 일반 사용자 모드
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return NextResponse.json(
          { error: '로그인이 필요합니다.' },
          { status: 401 }
        )
      }
      
      currentUserId = user.id
    }

    // 프로젝트 정보 조회
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_id, artist_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 권한 확인: 프로젝트 소유자이거나 아티스트 소유자/관리자인지 확인
    let hasPermission = project.owner_id === currentUserId

    if (!hasPermission && project.artist_id) {
      // 아티스트 소유자 또는 관리자인지 확인
      const { data: artist } = await supabase
        .from('artists')
        .select('id, user_id')
        .eq('id', project.artist_id)
        .single()

      if (artist) {
        if (artist.user_id === currentUserId) {
          hasPermission = true
        } else {
          // 아티스트 멤버 권한 확인
          const { data: artistMember } = await supabase
            .from('artist_members')
            .select('permission')
            .eq('artist_id', project.artist_id)
            .eq('user_id', currentUserId)
            .single()

          if (artistMember && (artistMember.permission === '전체 권한' || artistMember.permission === '편집 권한')) {
            hasPermission = true
          }
        }
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: '프로젝트 멤버를 추가할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 이미 추가된 멤버인지 확인
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json(
        { error: '이미 추가된 멤버입니다.' },
        { status: 400 }
      )
    }

    // 프로젝트 멤버 추가 (RLS 해제됨 - 일반 클라이언트 사용)
    console.log('[프로젝트 멤버 API] 멤버 추가 시도:', { projectId, userId, role, permission })
    
    const { data: newMember, error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
        permission,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[프로젝트 멤버 API] 멤버 추가 오류:', insertError)
      return NextResponse.json(
        { 
          error: insertError.message || '멤버 추가에 실패했습니다.',
          code: insertError.code,
          details: insertError.details
        },
        { status: 500 }
      )
    }
    
    console.log('[프로젝트 멤버 API] 멤버 추가 성공:', newMember)

    // 프로젝트의 member_count 업데이트
    const { data: projectData } = await supabase
      .from('projects')
      .select('member_count')
      .eq('id', projectId)
      .single()

    if (projectData) {
      await supabase
        .from('projects')
        .update({ member_count: (projectData.member_count || 0) + 1 })
        .eq('id', projectId)
    }

    return NextResponse.json({
      success: true,
      data: newMember,
      message: '멤버가 추가되었습니다.',
    })
  } catch (error: any) {
    console.error('프로젝트 멤버 추가 오류:', error)
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

