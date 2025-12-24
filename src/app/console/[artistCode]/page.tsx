import { redirect } from "next/navigation"

export default function ArtistCodePage({
  params,
}: {
  params: { artistCode: string }
}) {
  redirect(`/console/${params.artistCode}/home`)
}

