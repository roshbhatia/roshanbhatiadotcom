import React from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTheme } from '../contexts/ThemeContext'

const DemoPage: React.FC = () => {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen bg-bg text-text p-8">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <h1 className="mono text-4xl md:text-6xl font-bold animate-fade-in">
            Design System Demo
          </h1>
          <p className="mono text-lg text-border max-w-2xl mx-auto animate-slide-up">
            Experience the design system in action with interactive components and real-world examples.
          </p>
          <div className="flex justify-center gap-4 animate-slide-up">
            <Badge variant="default">Interactive</Badge>
            <Badge variant="secondary">Responsive</Badge>
            <Badge variant="outline">Accessible</Badge>
          </div>
        </section>

        {/* Interactive Dashboard */}
        <section className="space-y-6">
          <h2 className="mono text-2xl font-semibold">Interactive Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Performance</CardTitle>
                  <Badge variant="default">Live</Badge>
                </div>
                <CardDescription>Real-time system metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-semibold">42%</span>
                  </div>
                  <div className="w-full bg-border/20 rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Memory</span>
                    <span className="text-sm font-semibold">1.2GB</span>
                  </div>
                  <div className="w-full bg-border/20 rounded-full h-2">
                    <div className="bg-accent h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <Badge variant="destructive">3 New</Badge>
                </div>
                <CardDescription>Recent system alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Build completed successfully</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">High memory usage detected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">New deployment available</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        🚀 Deploy
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Deploy to production</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        📊 Analytics
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View system analytics</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        ⚙️ Settings
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure system settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Settings Panel */}
        <section className="space-y-6">
          <h2 className="mono text-2xl font-semibold">Settings Panel</h2>
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>Configure your preferences and system options</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-save</h4>
                      <p className="text-sm text-border">Automatically save changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Analytics</h4>
                      <p className="text-sm text-border">Share usage data</p>
                    </div>
                    <Switch />
                  </div>
                </TabsContent>
                
                <TabsContent value="appearance" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Theme</h4>
                      <p className="text-sm text-border">Current: {theme}</p>
                    </div>
                    <Badge variant="outline">{theme}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Animations</h4>
                      <p className="text-sm text-border">Enable UI animations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </TabsContent>
                
                <TabsContent value="notifications" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-border">Receive email updates</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-border">Browser notifications</p>
                    </div>
                    <Switch />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Loading States */}
        <section className="space-y-6">
          <h2 className="mono text-2xl font-semibold">Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Loading</CardTitle>
                <CardDescription>Fetching system information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm">Loading user data...</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-border/20 rounded animate-pulse"></div>
                    <div className="h-4 bg-border/20 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-border/20 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Action Processing</CardTitle>
                <CardDescription>System is working on your request</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button disabled className="w-full">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </Button>
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm text-border mt-2">Please wait</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Modal Examples */}
        <section className="space-y-6">
          <h2 className="mono text-2xl font-semibold">Modal Interactions</h2>
          <div className="flex flex-wrap gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Confirmation Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Action</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to proceed with this action? This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm">
                    This action will permanently delete the selected item and all associated data.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button variant="destructive">Delete</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Form Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Item</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to create a new item.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter name..."
                      className="w-full px-3 py-2 border border-border rounded-md bg-bg/50 text-text font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea 
                      placeholder="Enter description..."
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-md bg-bg/50 text-text font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <DialogTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button>Create Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-8 text-center">
          <p className="mono text-sm text-border">
            Design System Demo • Built with React, TypeScript, and Tailwind CSS
          </p>
        </footer>
      </div>
    </div>
  )
}

export default DemoPage