-- ============================================
-- 아티스트 생성 시 소유자를 멤버로 자동 추가
-- 아티스트가 생성될 때 소유자를 "소유자" 역할과 "전체 권한"으로 자동 등록
-- ============================================

-- 아티스트 생성 시 소유자를 멤버로 자동 추가하는 트리거 함수
CREATE OR REPLACE FUNCTION auto_add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  -- 아티스트 생성 시 소유자를 멤버로 자동 추가
  INSERT INTO public.artist_members (
    artist_id,
    user_id,
    role,
    permission
  ) VALUES (
    NEW.id,
    NEW.user_id,
    '소유자',
    '전체 권한'
  )
  ON CONFLICT (artist_id, user_id) DO NOTHING; -- 이미 존재하면 무시
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 아티스트 생성 시 트리거
DROP TRIGGER IF EXISTS auto_add_owner_as_member_trigger ON public.artists;
CREATE TRIGGER auto_add_owner_as_member_trigger
  AFTER INSERT ON public.artists
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_owner_as_member();

-- 함수 코멘트
COMMENT ON FUNCTION auto_add_owner_as_member() IS '아티스트 생성 시 소유자를 멤버로 자동 추가하는 트리거 함수';

-- 기존 아티스트 중 소유자가 멤버로 등록되지 않은 경우 추가
DO $$
DECLARE
  artist_record RECORD;
  added_count INTEGER := 0;
BEGIN
  -- 소유자가 멤버로 등록되지 않은 아티스트 찾기
  FOR artist_record IN
    SELECT a.id, a.user_id
    FROM public.artists a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.artist_members am
      WHERE am.artist_id = a.id
        AND am.user_id = a.user_id
    )
  LOOP
    -- 소유자를 멤버로 추가
    INSERT INTO public.artist_members (
      artist_id,
      user_id,
      role,
      permission
    ) VALUES (
      artist_record.id,
      artist_record.user_id,
      '소유자',
      '전체 권한'
    )
    ON CONFLICT (artist_id, user_id) DO NOTHING;
    
    added_count := added_count + 1;
  END LOOP;
  
  IF added_count > 0 THEN
    RAISE NOTICE '기존 아티스트 %개의 소유자가 멤버로 추가되었습니다.', added_count;
  ELSE
    RAISE NOTICE '기존 아티스트 중 소유자가 멤버로 등록되지 않은 아티스트가 없습니다.';
  END IF;
END $$;

