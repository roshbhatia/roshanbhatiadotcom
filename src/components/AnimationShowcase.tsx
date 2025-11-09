import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

const AnimationShowcase: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pulse Animation</CardTitle>
          <CardDescription>Subtle attention-grabbing effect</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-accent/20 rounded animate-pulse"></div>
            <Button className="animate-pulse">Pulsing Button</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bounce Animation</CardTitle>
          <CardDescription>Playful interaction feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-accent/20 rounded animate-bounce"></div>
            <Button className="animate-bounce">Bouncing Button</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spin Animation</CardTitle>
          <CardDescription>Continuous rotation effect</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-accent/20 rounded animate-spin"></div>
            <Button className="animate-spin">Spinning Button</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ping Animation</CardTitle>
          <CardDescription>Notification-style effect</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <div className="h-4 w-4 bg-accent rounded-full animate-ping absolute"></div>
              <div className="h-4 w-4 bg-accent rounded-full"></div>
            </div>
            <Button className="relative">
              <span className="absolute h-2 w-2 bg-red-500 rounded-full animate-ping"></span>
              Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AnimationShowcase