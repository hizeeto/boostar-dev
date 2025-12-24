-- ============================================
-- 스토리지 이미지 자동 삭제 트리거
-- 아티스트나 프로필 삭제 시 관련 이미지를 스토리지에서도 삭제
-- ============================================

-- 아티스트 삭제 시 이미지 삭제 함수 (커버 이미지 포함)
CREATE OR REPLACE FUNCTION cleanup_artist_image_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  image_path TEXT;
  cover_image_path TEXT;
BEGIN
  -- 삭제되는 아티스트의 icon_url이 있으면 스토리지에서 삭제
  IF OLD.icon_url IS NOT NULL AND OLD.icon_url LIKE '%/artist-images/%' THEN
    -- URL에서 파일 경로 추출 (artist-images/ 이후 부분)
    image_path := split_part(split_part(OLD.icon_url, '/artist-images/', 2), '?', 1);
    
    IF image_path IS NOT NULL AND image_path != '' THEN
      -- 스토리지에서 이미지 삭제
      DELETE FROM storage.objects
      WHERE bucket_id = 'avatars'
        AND name = 'artist-images/' || image_path;
    END IF;
  END IF;
  
  -- 삭제되는 아티스트의 cover_image_url이 있으면 스토리지에서 삭제
  IF OLD.cover_image_url IS NOT NULL AND OLD.cover_image_url LIKE '%/cover-images/%' THEN
    -- URL에서 파일 경로 추출 (cover-images/ 이후 부분)
    cover_image_path := split_part(split_part(OLD.cover_image_url, '/cover-images/', 2), '?', 1);
    
    IF cover_image_path IS NOT NULL AND cover_image_path != '' THEN
      -- 스토리지에서 커버 이미지 삭제
      DELETE FROM storage.objects
      WHERE bucket_id = 'avatars'
        AND name = 'cover-images/' || cover_image_path;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 아티스트 삭제 트리거 생성
DROP TRIGGER IF EXISTS cleanup_artist_image_trigger ON public.artists;
CREATE TRIGGER cleanup_artist_image_trigger
  BEFORE DELETE ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_artist_image_on_delete();

-- 프로필 삭제 시 이미지 삭제 함수
CREATE OR REPLACE FUNCTION cleanup_profile_image_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  image_path TEXT;
BEGIN
  -- 삭제되는 프로필의 avatar_url이 있으면 스토리지에서 삭제
  IF OLD.avatar_url IS NOT NULL AND OLD.avatar_url LIKE '%/profile-images/%' THEN
    -- URL에서 파일 경로 추출 (profile-images/ 이후 부분)
    image_path := split_part(split_part(OLD.avatar_url, '/profile-images/', 2), '?', 1);
    
    IF image_path IS NOT NULL AND image_path != '' THEN
      -- 스토리지에서 이미지 삭제
      DELETE FROM storage.objects
      WHERE bucket_id = 'avatars'
        AND name = 'profile-images/' || image_path;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 프로필 삭제 트리거 생성
DROP TRIGGER IF EXISTS cleanup_profile_image_trigger ON public.profiles;
CREATE TRIGGER cleanup_profile_image_trigger
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_profile_image_on_delete();

-- 함수 코멘트
COMMENT ON FUNCTION cleanup_artist_image_on_delete() IS 
  '아티스트 삭제 시 스토리지의 아티스트 이미지와 커버 이미지를 자동으로 삭제하는 함수';
  
COMMENT ON FUNCTION cleanup_profile_image_on_delete() IS 
  '프로필 삭제 시 스토리지의 프로필 이미지를 자동으로 삭제하는 함수';

