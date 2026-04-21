import type { Dispatch, SetStateAction } from 'react'

import { Field } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { inputClassName } from '../ui/classNames'

export function MediaSection({
  videos,
  setVideos,
  reels,
  setReels,
}: {
  videos: { intro: string; walkthrough: string; extra: string }
  setVideos: Dispatch<SetStateAction<{ intro: string; walkthrough: string; extra: string }>>
  reels: { reel1: string; reel2: string; reel3: string }
  setReels: Dispatch<SetStateAction<{ reel1: string; reel2: string; reel3: string }>>
}) {
  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Videos" subtitle="Max 3 videos (Intro, Walkthrough, Extra). Paste URLs (YouTube/Vimeo/MP4).">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Intro video URL">
            <input
              className={inputClassName()}
              placeholder="https://..."
              value={videos.intro}
              onChange={(e) => setVideos((prev) => ({ ...prev, intro: e.target.value }))}
            />
          </Field>
          <Field label="Walkthrough video URL">
            <input
              className={inputClassName()}
              placeholder="https://..."
              value={videos.walkthrough}
              onChange={(e) => setVideos((prev) => ({ ...prev, walkthrough: e.target.value }))}
            />
          </Field>
          <Field label="Extra video URL">
            <input
              className={inputClassName()}
              placeholder="https://..."
              value={videos.extra}
              onChange={(e) => setVideos((prev) => ({ ...prev, extra: e.target.value }))}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Reels" subtitle="Max 3 reels. Paste URLs (Instagram/Shorts/MP4).">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Reel 1 URL">
            <input
              className={inputClassName()}
              placeholder="https://..."
              value={reels.reel1}
              onChange={(e) => setReels((prev) => ({ ...prev, reel1: e.target.value }))}
            />
          </Field>
          <Field label="Reel 2 URL">
            <input
              className={inputClassName()}
              placeholder="https://..."
              value={reels.reel2}
              onChange={(e) => setReels((prev) => ({ ...prev, reel2: e.target.value }))}
            />
          </Field>
          <Field label="Reel 3 URL">
            <input
              className={inputClassName()}
              placeholder="https://..."
              value={reels.reel3}
              onChange={(e) => setReels((prev) => ({ ...prev, reel3: e.target.value }))}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  )
}

