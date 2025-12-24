import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const keyword = searchParams.get('keyword')

  if (!keyword) {
    return NextResponse.json(
      { error: '검색어가 필요합니다.' },
      { status: 400 }
    )
  }

  try {
    const apiKey = 'U01TX0FVVEgyMDI1MTIxMDE2MjE0NjExNjU1NDE='
    
    // 도로명주소 검색 API 호출 (GET 방식)
    // 참고: 팝업 API 승인키는 검색 API에서도 사용 가능한 경우가 있지만, 
    // 별도 검색 API 승인키가 필요할 수 있습니다.
    const params = new URLSearchParams()
    params.append('confmKey', apiKey)
    params.append('keyword', keyword)
    params.append('resultType', 'json')
    params.append('currentPage', '1')
    params.append('countPerPage', '20')

    const apiUrl = `https://business.juso.go.kr/addrlink/addrLinkApi.do?${params.toString()}`
    
    console.log('주소 검색 API 호출 (GET)')
    console.log('승인키:', apiKey)
    console.log('검색어:', keyword)
    console.log('API URL:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    const text = await response.text()
    console.log('API 응답 원문:', text)

    let data
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError)
      return NextResponse.json(
        { error: 'API 응답 파싱 오류', rawResponse: text },
        { status: 500 }
      )
    }

    console.log('API 응답 데이터:', JSON.stringify(data, null, 2))

    // 에러 응답 확인
    if (data.results?.common?.errorCode !== '0') {
      console.error('API 에러:', data.results?.common)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('주소 검색 API 오류:', error)
    return NextResponse.json(
      { error: '주소 검색 중 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    )
  }
}

