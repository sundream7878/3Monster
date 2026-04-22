import os
import sys
import requests
import logging
from sb_auth_manager import SupabaseAuthManager
import config

logger = logging.getLogger(__name__)

class MonsterUpdater:
    """
    [3Monster Master Library] 표준 자동 업데이트 엔진 v1.0
    모든 3Monster 계열 앱의 공통 업데이트를 담당하는 마스터 라이브러리입니다.
    """
    
    VERSION = "1.0.0"
    
    @classmethod
    def check_for_updates(cls, product_id, current_version):
        """서버에서 최신 버전을 확인합니다."""
        client = SupabaseAuthManager._get_client()
        if not client: return None

        try:
            response = client.table("app_versions") \
                .select("*") \
                .eq("product_id", product_id) \
                .order("version", desc=True) \
                .limit(1) \
                .execute()

            if response.data:
                latest = response.data[0]
                if cls._is_newer(latest['version'], current_version):
                    return latest
            return None
        except Exception as e:
            logger.error(f"업데이트 체크 오류: {e}")
            return None

    @staticmethod
    def _is_newer(latest, current):
        try:
            return [int(p) for p in latest.split('.')] > [int(p) for p in current.split('.')]
        except: return latest > current

    @classmethod
    def download_to(cls, download_url, save_path):
        """파일 다운로드"""
        try:
            response = requests.get(download_url, stream=True)
            response.raise_for_status()
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
        except Exception as e:
            logger.error(f"다운로드 실패: {e}")
            return False
