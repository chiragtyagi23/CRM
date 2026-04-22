import { useState, type Dispatch, type SetStateAction } from 'react'

import type { OverviewFactsState } from '../types'
import { apiUploadImage } from '../../../lib/crmApi'
import { Field } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { inputClassName } from '../ui/classNames'

export function OverviewSection({
  campaignName,
  setCampaignName,
  logoUrl,
  setLogoUrl,
  coverImageUrl,
  setCoverImageUrl,
  contactEmail,
  setContactEmail,
  contactMobile,
  setContactMobile,
  startingPrice,
  setStartingPrice,
  completionDate,
  setCompletionDate,
  bhkRange,
  setBhkRange,
  priceRange,
  setPriceRange,
  projectLocation,
  setProjectLocation,
  totalFloors,
  setTotalFloors,
  squareFeetRanges,
  setSquareFeetRanges,
  possessionDate,
  reraNo,
  setReraNo,
  overviewFacts,
  setOverviewFacts,
}: {
  campaignName: string
  setCampaignName: Dispatch<SetStateAction<string>>
  logoUrl: string
  setLogoUrl: Dispatch<SetStateAction<string>>
  coverImageUrl: string
  setCoverImageUrl: Dispatch<SetStateAction<string>>
  contactEmail: string
  setContactEmail: Dispatch<SetStateAction<string>>
  contactMobile: string
  setContactMobile: Dispatch<SetStateAction<string>>
  startingPrice: string
  setStartingPrice: Dispatch<SetStateAction<string>>
  completionDate: string
  setCompletionDate: Dispatch<SetStateAction<string>>
  bhkRange: string
  setBhkRange: Dispatch<SetStateAction<string>>
  priceRange: string
  setPriceRange: Dispatch<SetStateAction<string>>
  projectLocation: string
  setProjectLocation: Dispatch<SetStateAction<string>>
  totalFloors: string
  setTotalFloors: Dispatch<SetStateAction<string>>
  squareFeetRanges: string
  setSquareFeetRanges: Dispatch<SetStateAction<string>>
  possessionDate: string
  reraNo: string
  setReraNo: Dispatch<SetStateAction<string>>
  overviewFacts: OverviewFactsState
  setOverviewFacts: Dispatch<SetStateAction<OverviewFactsState>>
}) {
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)

  return (
    <SectionCard title="Overview" subtitle="Main overview description and key points.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">Basic project info</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Project name" required>
              <input className={inputClassName()} value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Project Name" />
            </Field>
            <Field label="Logo (upload)">
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  disabled={logoUploading}
                  onChange={async (e) => {
                    const file = e.currentTarget.files?.[0]
                    if (!file) return
                    setLogoError(null)
                    setLogoUploading(true)
                    try {
                      const url = await apiUploadImage(file)
                      setLogoUrl(url)
                    } catch (err: unknown) {
                      setLogoError(err instanceof Error ? err.message : 'Upload failed')
                    } finally {
                      setLogoUploading(false)
                      e.currentTarget.value = ''
                    }
                  }}
                />
                <div className="text-xs text-gray-500">{logoUploading ? 'Uploading…' : 'Used as project logo in template.'}</div>
                {logoError ? <div className="text-xs font-semibold text-red-700">{logoError}</div> : null}
                {logoUrl.trim().length > 0 ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={logoUrl} alt="" className="h-8 w-8 rounded object-cover border border-gray-200" />
                      <div className="truncate text-[11px] font-medium text-gray-500">{logoUrl}</div>
                    </div>
                    <button
                      type="button"
                      className="h-8 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
                      onClick={() => setLogoUrl('')}
                      disabled={logoUploading}
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </div>
            </Field>
            <Field label="Cover image (upload)" required>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={coverUploading}
                    onChange={async (e) => {
                      const file = e.currentTarget.files?.[0]
                      if (!file) return
                      setCoverError(null)
                      setCoverUploading(true)
                      try {
                        const url = await apiUploadImage(file)
                        setCoverImageUrl(url)
                      } catch (err: unknown) {
                        setCoverError(err instanceof Error ? err.message : 'Upload failed')
                      } finally {
                        setCoverUploading(false)
                        // Allow selecting the same file again if needed
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                  <div className="text-xs text-gray-500">
                    {coverUploading ? 'Uploading…' : 'This image is used on the Upcoming Projects card.'}
                  </div>
                  {coverError ? <div className="text-xs font-semibold text-red-700">{coverError}</div> : null}
                </div>

                {coverImageUrl.trim().length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <img src={coverImageUrl} alt="" className="block h-[140px] w-full object-cover" />
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <div className="truncate text-[11px] font-medium text-gray-500">{coverImageUrl}</div>
                      <button
                        type="button"
                        className="h-8 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
                        onClick={() => setCoverImageUrl('')}
                        disabled={coverUploading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Field>
            <Field label="Email">
              <input className={inputClassName()} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="sales@example.com" />
            </Field>
            <Field label="Mobile no.">
              <input className={inputClassName()} value={contactMobile} onChange={(e) => setContactMobile(e.target.value)} placeholder="+91 99999 99999" />
            </Field>
            <Field label="Location" required>
              <input className={inputClassName()} value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} placeholder="Sector 18, Kharghar, Navi Mumbai" />
            </Field>
            <Field label="Starting price" required>
              <input className={inputClassName()} value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} placeholder="₹ 2.80 Cr*" />
            </Field>
            <Field label="Completion date (CBT)">
              <input className={inputClassName()} value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} placeholder="31 Dec 2027" />
            </Field>
            <Field label="RERA registration number" required>
              <input className={inputClassName()} value={reraNo} onChange={(e) => setReraNo(e.target.value)} placeholder="P51700078765" />
            </Field>
            <Field label="BHK range">
              <input className={inputClassName()} value={bhkRange} onChange={(e) => setBhkRange(e.target.value)} placeholder="2 BHK, 3 BHK" />
            </Field>
            <Field label="Price range">
              <input className={inputClassName()} value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="₹ 2.80 Cr* – ₹ 9.80 Cr*" />
            </Field>
            <Field label="Total floors" required>
              <input className={inputClassName()} value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} placeholder="36" />
            </Field>
            <Field label="Square feet ranges">
              <input className={inputClassName()} value={squareFeetRanges} onChange={(e) => setSquareFeetRanges(e.target.value)} placeholder="950 – 3,800 Sq.ft." />
            </Field>
            <Field label="Possession">
              <input className={inputClassName()} value={possessionDate} readOnly />
            </Field>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">Additional overview fields</div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Serial Number">
              <input className={inputClassName()} value={overviewFacts.serialNumber} onChange={(e) => setOverviewFacts((p) => ({ ...p, serialNumber: e.target.value }))} />
            </Field>
            <Field label="Code Name">
              <input className={inputClassName()} value={overviewFacts.codeName} onChange={(e) => setOverviewFacts((p) => ({ ...p, codeName: e.target.value }))} />
            </Field>
            <Field label="Location (detail)">
              <input className={inputClassName()} value={overviewFacts.location} onChange={(e) => setOverviewFacts((p) => ({ ...p, location: e.target.value }))} />
            </Field>
            <Field label="Land Parcel">
              <input className={inputClassName()} value={overviewFacts.landParcel} onChange={(e) => setOverviewFacts((p) => ({ ...p, landParcel: e.target.value }))} />
            </Field>
            <Field label="Project">
              <input className={inputClassName()} value={overviewFacts.project} onChange={(e) => setOverviewFacts((p) => ({ ...p, project: e.target.value }))} />
            </Field>
            <Field label="Apartments">
              <input className={inputClassName()} value={overviewFacts.apartments} onChange={(e) => setOverviewFacts((p) => ({ ...p, apartments: e.target.value }))} />
            </Field>
            <Field label="Building">
              <input className={inputClassName()} value={overviewFacts.building} onChange={(e) => setOverviewFacts((p) => ({ ...p, building: e.target.value }))} />
            </Field>
            <Field label="Carpet Areas">
              <input className={inputClassName()} value={overviewFacts.carpetAreas} onChange={(e) => setOverviewFacts((p) => ({ ...p, carpetAreas: e.target.value }))} />
            </Field>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
