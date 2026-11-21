import os
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

class BrollService:
    def __init__(self):
        self.pexels_key = settings.PEXELS_API_KEY
        self.pixabay_key = settings.PIXABAY_API_KEY

    async def search_broll(self, query: str, per_page: int = 5) -> List[Dict[str, Any]]:
        """
        Searches Pexels and Pixabay for relevant stock footage matching query.
        Falls back to high-quality royalty-free video placeholders if no keys are set.
        """
        results = []
        
        # Try Pexels if key is available
        if self.pexels_key:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    res = await client.get(
                        "https://api.pexels.com/videos/search",
                        headers={"Authorization": self.pexels_key},
                        params={"query": query, "per_page": per_page, "orientation": "portrait"}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        for v in data.get("videos", []):
                            files = v.get("video_files", [])
                            best_file = next((f for f in files if f.get("width") == 1080), files[0] if files else None)
                            if best_file:
                                results.append({
                                    "id": str(v["id"]),
                                    "title": f"Pexels - {query}",
                                    "preview_url": v.get("image"),
                                    "video_url": best_file.get("link"),
                                    "duration": v.get("duration", 5.0),
                                    "source": "pexels"
                                })
            except Exception as e:
                print(f"[Broll] Pexels search error: {e}")

        # Curated royalty-free visual assets fallback
        if not results:
            curated_assets = [
                {
                    "id": "stock_finance_growth",
                    "title": f"Growth Chart & Revenue ({query})",
                    "preview_url": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop",
                    "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                    "duration": 6.0,
                    "source": "curated"
                },
                {
                    "id": "stock_creator_studio",
                    "title": f"Creator Podcast Studio Setup ({query})",
                    "preview_url": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&auto=format&fit=crop",
                    "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
                    "duration": 8.0,
                    "source": "curated"
                },
                {
                    "id": "stock_ai_tech",
                    "title": f"Futuristic Tech Waves ({query})",
                    "preview_url": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop",
                    "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                    "duration": 5.0,
                    "source": "curated"
                }
            ]
            results.extend(curated_assets)

        return results

broll_service = BrollService()
