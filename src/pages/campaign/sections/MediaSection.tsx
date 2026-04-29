import type { Dispatch, SetStateAction } from 'react'

import { CampaignVideoTile } from '../../../components/CampaignVideoTile'
import { SectionCard } from '../../../ui/campaign/SectionCard'

export function MediaSection({
  videos,
  setVideos,
  reels,
  setReels,
}: {
  videos: { intro: { url: string; file?: File }; walkthrough: { url: string; file?: File }; extra: { url: string; file?: File } }
  setVideos: Dispatch<
    SetStateAction<{ intro: { url: string; file?: File }; walkthrough: { url: string; file?: File }; extra: { url: string; file?: File } }>
  >
  reels: { reel1: { url: string; file?: File }; reel2: { url: string; file?: File }; reel3: { url: string; file?: File } }
  setReels: Dispatch<
    SetStateAction<{ reel1: { url: string; file?: File }; reel2: { url: string; file?: File }; reel3: { url: string; file?: File } }>
  >
}) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Videos" subtitle="3 long videos. Upload a file (up to 1 GB) or paste a direct video URL (mp4/webm).">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CampaignVideoTile
            label="Intro"
            hint="Long video (overview/intro)."
            value={videos.intro}
            onChange={(next) => setVideos((prev) => ({ ...prev, intro: next }))}
          />
          <CampaignVideoTile
            label="Walkthrough"
            hint="Long walkthrough video."
            value={videos.walkthrough}
            onChange={(next) => setVideos((prev) => ({ ...prev, walkthrough: next }))}
          />
          <CampaignVideoTile
            label="Extra"
            hint="Any additional long video."
            value={videos.extra}
            onChange={(next) => setVideos((prev) => ({ ...prev, extra: next }))}
          />
        </div>
      </SectionCard>

      <SectionCard title="Reels" subtitle="3 short reels. Upload a file (up to 1 GB) or paste a direct video URL.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CampaignVideoTile
            label="Reel 1"
            hint="15–30 sec reel."
            value={reels.reel1}
            onChange={(next) => setReels((prev) => ({ ...prev, reel1: next }))}
          />
          <CampaignVideoTile
            label="Reel 2"
            hint="15–30 sec reel."
            value={reels.reel2}
            onChange={(next) => setReels((prev) => ({ ...prev, reel2: next }))}
          />
          <CampaignVideoTile
            label="Reel 3"
            hint="15–30 sec reel."
            value={reels.reel3}
            onChange={(next) => setReels((prev) => ({ ...prev, reel3: next }))}
          />
        </div>
      </SectionCard>
    </div>
  )
}

