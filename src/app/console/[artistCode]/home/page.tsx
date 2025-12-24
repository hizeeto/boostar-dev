export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">홈</h1>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-background" />
        <div className="aspect-video rounded-xl bg-background" />
        <div className="aspect-video rounded-xl bg-background" />
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-background md:min-h-min" />
    </div>
  )
}

