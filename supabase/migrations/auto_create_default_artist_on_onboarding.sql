-- ============================================
-- 온보딩 완료 시 기본 아티스트 자동 생성
-- profiles 테이블의 onboarding_completed가 true로 변경될 때
-- 아티스트가 없으면 "기본 아티스트"를 자동으로 생성
-- ============================================

-- artist_code 생성 함수 (재사용 가능)
CREATE OR REPLACE FUNCTION generate_artist_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  code TEXT := '';
  i INTEGER;
  exists_check BOOLEAN;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  -- 중복되지 않는 고유번호 생성 (최대 10회 시도)
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    
    -- 중복 확인
    SELECT EXISTS(SELECT 1 FROM public.artists WHERE artist_code = code) INTO exists_check;
    
    -- 중복되지 않으면 루프 종료
    EXIT WHEN NOT exists_check;
    
    attempts := attempts + 1;
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION '고유번호 생성에 실패했습니다. (최대 시도 횟수 초과)';
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 기본 아티스트 자동 생성 함수
CREATE OR REPLACE FUNCTION create_default_artist_for_user(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  artist_id UUID;
  artist_code TEXT;
  existing_artist_count INTEGER;
BEGIN
  -- 이미 아티스트가 있는지 확인
  SELECT COUNT(*) INTO existing_artist_count
  FROM public.artists
  WHERE user_id = user_uuid;
  
  -- 아티스트가 이미 있으면 생성하지 않음
  IF existing_artist_count > 0 THEN
    RAISE NOTICE '사용자 %에게 이미 아티스트가 존재합니다. 기본 아티스트 생성을 건너뜁니다.', user_uuid;
    RETURN NULL;
  END IF;
  
  -- 고유번호 생성
  artist_code := generate_artist_code();
  
  -- 기본 아티스트 생성
  INSERT INTO public.artists (
    user_id,
    name,
    description,
    icon_url,
    color,
    artist_code,
    is_default,
    sort_order
  ) VALUES (
    user_uuid,
    '기본 아티스트',
    NULL,
    NULL,
    NULL,
    artist_code,
    true,
    0
  )
  RETURNING id INTO artist_id;
  
  RAISE NOTICE '사용자 %에 대한 기본 아티스트가 생성되었습니다. (ID: %, Code: %)', user_uuid, artist_id, artist_code;
  
  RETURN artist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 온보딩 완료 시 기본 아티스트 자동 생성 트리거 함수
CREATE OR REPLACE FUNCTION trigger_create_default_artist_on_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- onboarding_completed가 false에서 true로 변경된 경우에만 실행
  IF NEW.onboarding_completed = true AND (OLD.onboarding_completed IS NULL OR OLD.onboarding_completed = false) THEN
    -- 기본 아티스트 생성 (이미 있으면 생성하지 않음)
    PERFORM create_default_artist_for_user(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS create_default_artist_on_onboarding_trigger ON public.profiles;
CREATE TRIGGER create_default_artist_on_onboarding_trigger
  AFTER UPDATE OF onboarding_completed ON public.profiles
  FOR EACH ROW
  WHEN (NEW.onboarding_completed = true)
  EXECUTE FUNCTION trigger_create_default_artist_on_onboarding();

-- INSERT 시에도 처리 (프로필 생성 시 onboarding_completed가 true인 경우)
CREATE OR REPLACE FUNCTION trigger_create_default_artist_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- 프로필 생성 시 onboarding_completed가 true인 경우
  IF NEW.onboarding_completed = true THEN
    -- 기본 아티스트 생성 (이미 있으면 생성하지 않음)
    PERFORM create_default_artist_for_user(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- INSERT 트리거 생성
DROP TRIGGER IF EXISTS create_default_artist_on_profile_insert_trigger ON public.profiles;
CREATE TRIGGER create_default_artist_on_profile_insert_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.onboarding_completed = true)
  EXECUTE FUNCTION trigger_create_default_artist_on_profile_insert();

-- 기존 온보딩 완료 사용자 중 아티스트가 없는 경우 기본 아티스트 생성
DO $$
DECLARE
  profile_record RECORD;
  created_count INTEGER := 0;
BEGIN
  -- 온보딩을 완료했지만 아티스트가 없는 사용자 찾기
  FOR profile_record IN
    SELECT p.id, p.nickname, p.full_name
    FROM public.profiles p
    WHERE p.onboarding_completed = true
      AND NOT EXISTS (
        SELECT 1 FROM public.artists a
        WHERE a.user_id = p.id
      )
  LOOP
    -- 기본 아티스트 생성
    PERFORM create_default_artist_for_user(profile_record.id);
    created_count := created_count + 1;
  END LOOP;
  
  IF created_count > 0 THEN
    RAISE NOTICE '기존 온보딩 완료 사용자 %명에게 기본 아티스트가 생성되었습니다.', created_count;
  ELSE
    RAISE NOTICE '기존 온보딩 완료 사용자 중 아티스트가 없는 사용자가 없습니다.';
  END IF;
END $$;

-- 함수 및 트리거 코멘트
COMMENT ON FUNCTION generate_artist_code() IS '8자리 고유 아티스트 코드 생성 함수';
COMMENT ON FUNCTION create_default_artist_for_user(UUID) IS '사용자에게 기본 아티스트를 생성하는 함수';
COMMENT ON FUNCTION trigger_create_default_artist_on_onboarding() IS '온보딩 완료 시 기본 아티스트 자동 생성 트리거 함수';
COMMENT ON FUNCTION trigger_create_default_artist_on_profile_insert() IS '프로필 생성 시 기본 아티스트 자동 생성 트리거 함수';

