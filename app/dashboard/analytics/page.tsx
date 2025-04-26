"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/dashboard/header"

export default function AnalyticsPage() {
  return (
    <>
      <Header title="Analytics" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              Summary of your work over a period of time, including completed missions
            </p>
          </div>

          <div className="mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Overall Impact Score</CardTitle>
                <Badge variant="outline">?</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">56%</p>
                    <p className="text-xs text-muted-foreground">From your last month's score</p>
                  </div>
                  <div className="h-[200px] w-full max-w-[500px]">
                    {/* This would be a chart in a real implementation */}
                    <div className="flex h-full items-end gap-2">
                      <div className="h-[30%] w-8 rounded-t-md bg-primary/20"></div>
                      <div className="h-[50%] w-8 rounded-t-md bg-primary/40"></div>
                      <div className="h-[90%] w-8 rounded-t-md bg-primary"></div>
                      <div className="h-[70%] w-8 rounded-t-md bg-primary/30"></div>
                      <div className="h-[40%] w-8 rounded-t-md bg-primary/60"></div>
                      <div className="h-[60%] w-8 rounded-t-md bg-primary/80"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Contributions</CardTitle>
                <p className="text-sm text-muted-foreground">1,510 contributions in the past years</p>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  {/* This would be a contribution graph in a real implementation */}
                  <div className="grid h-full grid-cols-12 gap-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="grid grid-rows-7 gap-1">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <div
                            key={j}
                            className={`h-3 w-3 rounded-sm ${
                              Math.random() > 0.5 ? `bg-primary/[${Math.random() * 0.8 + 0.2}]` : "bg-muted"
                            }`}
                          ></div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
