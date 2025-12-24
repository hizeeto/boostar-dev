/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 배포를 위한 프로덕션 최적화 설정
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // 개발 환경에서만 파일 시스템 워처 설정
      if (!isServer) {
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
          ignored: ['**/node_modules', '**/.next', '**/.git']
        }
      }
      
      // 개발 환경에서만 캐시 비활성화
      config.cache = false
      
      // 개발 환경에서만 병렬 처리 제한
      config.parallelism = 1
    }
    
    return config
  },
  
  // 프로덕션에서는 압축 활성화 (기본값)
  // compress: true,
  
  // 프로덕션에서는 ETag 활성화 (기본값)
  // generateEtags: true,
}

module.exports = nextConfig
