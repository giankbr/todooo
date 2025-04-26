import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { Header } from "@/components/dashboard/header"

export default function LeaderboardPage() {
  const leaderboardData = [
    {
      rank: 1,
      name: "Sebastian Panda",
      id: "#123",
      company: "Microsoft Inc",
      score: 100,
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SP",
    },
    {
      rank: 2,
      name: "Sebastian Lee",
      id: "#122",
      company: "Google Inc",
      score: 87,
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SL",
    },
    {
      rank: 3,
      name: "Sebastian Dragon",
      id: "#125",
      company: "Google Inc",
      score: 77,
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SD",
    },
    {
      rank: 4,
      name: "Sebastian Frog",
      id: "#121",
      company: "Facebook Inc",
      score: 70,
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SF",
    },
  ]

  return (
    <>
      <Header title="Leaderboard" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Global leaderboard for August 1, 2023</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
              <Button variant="outline" size="sm">
                Select Date
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-5">MEMBER NAME</div>
                  <div className="col-span-4">COMPANY</div>
                  <div className="col-span-2 text-right">IMPACT SCORE</div>
                </div>
                {leaderboardData.map((item) => (
                  <div key={item.rank} className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-1 text-center font-medium">{item.rank}</div>
                    <div className="col-span-5 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.avatar || "/placeholder.svg"} alt={item.name} />
                        <AvatarFallback>{item.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.id}</p>
                      </div>
                    </div>
                    <div className="col-span-4">{item.company}</div>
                    <div className="col-span-2 text-right">
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        {item.score}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
