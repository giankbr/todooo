import { Header } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function ShareImpactPage() {
  return (
    <>
      <Header title="Share My Impact" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">You need to share your impact to make an impact.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Set your criteria & frequency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="impact-id">Share my Impact</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input id="impact-id" value="10" className="w-16" />
                        <span className="text-sm text-muted-foreground">What level to share (min 5 recommended)</span>
                      </div>
                    </div>

                    <div>
                      <Label>What completes priority task</Label>
                      <RadioGroup defaultValue="high" className="mt-2 flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="high" />
                          <Label htmlFor="high">High</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium">Medium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low" id="low" />
                          <Label htmlFor="low">Low</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="share-with">Share with:</Label>
                      <Input id="share-with" placeholder="Enter email addresses separated by commas" className="mt-1" />
                    </div>

                    <div>
                      <Label>Report every</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span>Monday,</span>
                          <span>9:00 am</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Ends</Label>
                      <RadioGroup defaultValue="on-date" className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="never" id="never" />
                          <Label htmlFor="never">Never</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="on-date" id="on-date" />
                          <Label htmlFor="on-date">On date</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="after" id="after" />
                          <Label htmlFor="after">After</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="end-date">End on date</Label>
                      <Input id="end-date" type="date" className="mt-1" defaultValue="2023-12-30" />
                    </div>

                    <div>
                      <Label htmlFor="email-copy">Copy will be sent to you at</Label>
                      <Input id="email-copy" type="email" className="mt-1" placeholder="your@email.com" />
                    </div>

                    <Button className="w-full">Send Report</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Preview Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20"></div>
                        <span className="font-medium">MorfoTasks</span>
                      </div>
                      <p className="mb-2 font-medium">Pristia completed 5 high impact tasks this week</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-sm bg-yellow-500"></div>
                          <span className="text-sm">Task 1</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-sm bg-blue-500"></div>
                          <span className="text-sm">Task 2</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-sm bg-green-500"></div>
                          <span className="text-sm">Task 3</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email-address">Email Address</Label>
                      <Input id="email-address" type="email" className="mt-1" placeholder="recipient@email.com" />
                    </div>

                    <Button className="w-full">Send Test</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
