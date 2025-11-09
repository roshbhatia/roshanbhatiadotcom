import React from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimationShowcase from '../components/AnimationShowcase'
import { useTheme } from '../contexts/ThemeContext'

const DesignSystem: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  const colors = {
    bg: 'var(--bg)',
    text: 'var(--text)',
    border: 'var(--border)',
    accent: 'var(--accent)',
  }

  const typography = {
    h1: 'text-6xl font-mono font-bold',
    h2: 'text-4xl font-mono font-semibold',
    h3: 'text-2xl font-mono font-medium',
    h4: 'text-xl font-mono',
    body: 'text-base font-mono',
    small: 'text-sm font-mono',
    micro: 'text-xs font-mono',
  }

  return (
    <div className="min-h-screen bg-bg text-text p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className={typography.h1}>Design System</h1>
          <p className={`${typography.body} text-border max-w-2xl mx-auto`}>
            A comprehensive design system built with React, Tailwind CSS, and shadcn/ui components. 
            Featuring Rose Pine color scheme with Wumpus Mono typography.
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className={typography.small}>Current Theme: {theme}</span>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
        </header>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className={typography.h2}>Color Palette</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(colors).map(([name, value]) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle className="capitalize">{name}</CardTitle>
                  <CardDescription>{value}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="w-full h-24 rounded-md border border-border"
                    style={{ backgroundColor: value }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className={typography.h2}>Typography</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className={typography.h1}>Heading 1 - The Quick Brown Fox</h3>
              <p className="text-sm text-border">text-6xl font-mono font-bold</p>
            </div>
            <div className="space-y-2">
              <h3 className={typography.h2}>Heading 2 - Jumps Over The Lazy Dog</h3>
              <p className="text-sm text-border">text-4xl font-mono font-semibold</p>
            </div>
            <div className="space-y-2">
              <h3 className={typography.h3}>Heading 3 - Pack My Box With Five Dozen</h3>
              <p className="text-sm text-border">text-2xl font-mono font-medium</p>
            </div>
            <div className="space-y-2">
              <h4 className={typography.h4}>Heading 4 - Liquor Jugs</h4>
              <p className="text-sm text-border">text-xl font-mono</p>
            </div>
            <div className="space-y-2">
              <p className={typography.body}>
                Body text - The five boxing wizards jump quickly. How vexingly quick daft zebras jump! 
                Bright vixens jump dozy fowl quack. Quick wafting zephyrs vex bold Jim.
              </p>
              <p className="text-sm text-border">text-base font-mono</p>
            </div>
            <div className="space-y-2">
              <p className={typography.small}>
                Small text - Sphinx of black quartz, judge my vow. The quick brown fox jumps over the lazy dog.
              </p>
              <p className="text-sm text-border">text-sm font-mono</p>
            </div>
            <div className="space-y-2">
              <p className={typography.micro}>
                Micro text - Jackdaws love my big sphinx of quartz.
              </p>
              <p className="text-sm text-border">text-xs font-mono</p>
            </div>
          </div>
        </section>

        {/* Components */}
        <section className="space-y-6">
          <h2 className={typography.h2}>Components</h2>
          <Tabs defaultValue="buttons" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="dialogs">Dialogs</TabsTrigger>
              <TabsTrigger value="loading">Loading</TabsTrigger>
              <TabsTrigger value="animations">Animations</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>
            
            <TabsContent value="buttons" className="space-y-6">
              <div className="space-y-4">
                <h3 className={typography.h3}>Button Variants</h3>
                <div className="flex flex-wrap gap-4">
                  <Button variant="default">Default</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className={typography.h3}>Button Sizes</h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">🚀</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className={typography.h3}>Button States</h3>
                <div className="flex flex-wrap gap-4">
                  <Button>Normal</Button>
                  <Button disabled>Disabled</Button>
                  <Button className="opacity-75">Hover/Focus</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cards" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Simple Card</CardTitle>
                    <CardDescription>A basic card component with header and description</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className={typography.body}>
                      This is the content area of the card. It can contain any type of content.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Card</CardTitle>
                    <CardDescription>Card with interactive elements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" size="sm" className="w-full">Action Button</Button>
                    <div className="flex items-center justify-between">
                      <span className={typography.small}>Toggle Feature</span>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Code Card</CardTitle>
                    <CardDescription>Card with code example</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-bg/50 border border-border p-3 rounded text-xs overflow-x-auto">
                      <code>{`const theme = useTheme()
const { toggleTheme } = theme`}</code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="forms" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Form Elements</CardTitle>
                    <CardDescription>Various form controls and inputs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className={typography.small}>Text Input</label>
                      <input 
                        type="text" 
                        placeholder="Enter text..."
                        className="w-full px-3 py-2 border border-border rounded-md bg-bg/50 text-text font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className={typography.small}>Select Dropdown</label>
                      <select className="w-full px-3 py-2 border border-border rounded-md bg-bg/50 text-text font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent">
                        <option>Option 1</option>
                        <option>Option 2</option>
                        <option>Option 3</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className={typography.small}>Enable notifications</label>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Form Layout</CardTitle>
                    <CardDescription>Form with proper spacing and alignment</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={typography.small}>First Name</label>
                        <input 
                          type="text" 
                          placeholder="John"
                          className="w-full px-3 py-2 border border-border rounded-md bg-bg/50 text-text font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={typography.small}>Last Name</label>
                        <input 
                          type="text" 
                          placeholder="Doe"
                          className="w-full px-3 py-2 border border-border rounded-md bg-bg/50 text-text font-mono text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    </div>
                    <Button className="w-full">Submit Form</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="badges" className="space-y-6">
              <div className="space-y-4">
                <h3 className={typography.h3}>Badge Variants</h3>
                <div className="flex flex-wrap gap-4">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className={typography.h3}>Badge Usage</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={typography.body}>Status:</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={typography.body}>Priority:</span>
                    <Badge variant="destructive">High</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={typography.body}>Version:</span>
                    <Badge variant="outline">v2.0.1</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dialogs" className="space-y-6">
              <TooltipProvider>
                <div className="space-y-4">
                  <h3 className={typography.h3}>Dialog Examples</h3>
                  <div className="flex flex-wrap gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Open Dialog</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Dialog Title</DialogTitle>
                          <DialogDescription>
                            This is a dialog description. It provides context for the dialog content.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <p className={typography.body}>
                            Dialog content goes here. You can add any content you want.
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">Cancel</Button>
                          <Button size="sm">Confirm</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost">Hover for Tooltip</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is a tooltip with helpful information</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className={typography.h3}>Tooltip Variations</h3>
                  <div className="flex flex-wrap gap-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon">ℹ️</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Information tooltip</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon">⚠️</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Warning tooltip with additional context</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon">✅</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Success confirmation</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </TooltipProvider>
            </TabsContent>

            <TabsContent value="loading" className="space-y-6">
              <div className="space-y-4">
                <h3 className={typography.h3}>Loading Spinners</h3>
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className={typography.small}>Small</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="md" />
                    <span className={typography.small}>Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="lg" />
                    <span className={typography.small}>Large</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className={typography.h3}>Loading States</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Button Loading</CardTitle>
                      <CardDescription>Button with loading state</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button disabled>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Loading...
                        </Button>
                        <Button variant="outline" disabled>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Processing
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Card Loading</CardTitle>
                      <CardDescription>Card with skeleton loading</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 bg-border/20 rounded animate-pulse"></div>
                        <div className="h-4 bg-border/20 rounded w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-border/20 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="animations" className="space-y-6">
              <div className="space-y-4">
                <h3 className={typography.h3}>Animation Examples</h3>
                <AnimationShowcase />
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className={typography.h3}>Responsive Grid</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div className="border border-border p-4 rounded-md bg-bg/50 hover-lift">
                      <h4 className={typography.h4}>Mobile First</h4>
                      <p className={typography.small}>1 column on mobile</p>
                    </div>
                    <div className="border border-border p-4 rounded-md bg-bg/50 hover-lift">
                      <h4 className={typography.h4}>Tablet</h4>
                      <p className={typography.small}>2 columns on tablet</p>
                    </div>
                    <div className="border border-border p-4 rounded-md bg-bg/50 hover-lift">
                      <h4 className={typography.h4}>Desktop</h4>
                      <p className={typography.small}>4 columns on desktop</p>
                    </div>
                    <div className="border border-border p-4 rounded-md bg-bg/50 hover-lift">
                      <h4 className={typography.h4}>Responsive</h4>
                      <p className={typography.small}>Adaptive layout</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={typography.h3}>Flex Layout</h3>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex-1 min-w-[200px] border border-border p-4 rounded-md bg-bg/50 hover-lift">
                      <h4 className={typography.h4}>Flex Item 1</h4>
                      <p className={typography.small}>Flexible width</p>
                    </div>
                    <div className="flex-1 min-w-[200px] border border-border p-4 rounded-md bg-bg/50 hover-lift">
                      <h4 className={typography.h4}>Flex Item 2</h4>
                      <p className={typography.small}>Equal spacing</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={typography.h3}>Animated Elements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="border border-border p-4 rounded-md bg-bg/50 animate-fade-in">
                      <h4 className={typography.h4}>Fade In</h4>
                      <p className={typography.small}>Smooth fade animation</p>
                    </div>
                    <div className="border border-border p-4 rounded-md bg-bg/50 animate-slide-up">
                      <h4 className={typography.h4}>Slide Up</h4>
                      <p className={typography.small}>Slide from bottom</p>
                    </div>
                    <div className="border border-border p-4 rounded-md bg-bg/50 hover-lift">
                      <h4 className={typography.h4}>Hover Lift</h4>
                      <p className={typography.small}>Interactive hover effect</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Spacing & Layout */}
        <section className="space-y-6">
          <h2 className={typography.h2}>Spacing System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'XS', class: 'p-2', description: '8px' },
              { name: 'SM', class: 'p-4', description: '16px' },
              { name: 'MD', class: 'p-6', description: '24px' },
              { name: 'LG', class: 'p-8', description: '32px' },
            ].map((spacing) => (
              <Card key={spacing.name}>
                <CardHeader>
                  <CardTitle>{spacing.name}</CardTitle>
                  <CardDescription>{spacing.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`border border-border rounded-md bg-bg/50 ${spacing.class}`}>
                    <div className="border border-border rounded bg-accent/20 h-4 w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Interactive Examples */}
        <section className="space-y-6">
          <h2 className={typography.h2}>Interactive Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme Switcher</CardTitle>
                <CardDescription>Toggle between light and dark themes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={typography.body}>Dark Mode</span>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>
                <p className={typography.small}>
                  Current theme: <span className="text-accent font-semibold">{theme}</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Button Combinations</CardTitle>
                <CardDescription>Various button combinations and states</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Cancel</Button>
                  <Button size="sm">Save</Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">Edit</Button>
                  <Button variant="destructive" size="sm">Delete</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Design Principles */}
        <section className="space-y-6">
          <h2 className={typography.h2}>Design Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-lg">Minimalism</CardTitle>
                <CardDescription>Clean, focused design</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={typography.small}>
                  Every element serves a purpose. Remove distractions and focus on content.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-lg">Consistency</CardTitle>
                <CardDescription>Unified design language</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={typography.small}>
                  Consistent spacing, typography, and components create cohesive experiences.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-lg">Accessibility</CardTitle>
                <CardDescription>Inclusive by default</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={typography.small}>
                  Built with semantic HTML, proper contrast, and keyboard navigation.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
                <CardDescription>Fast and efficient</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={typography.small}>
                  Optimized components, minimal dependencies, and efficient rendering.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-lg">Responsive</CardTitle>
                <CardDescription>Mobile-first approach</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={typography.small}>
                  Seamless experience across all devices and screen sizes.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="text-lg">Typography</CardTitle>
                <CardDescription>Wumpus Mono focus</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={typography.small}>
                  Monospace typography creates character and technical authenticity.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-8 text-center">
          <div className="space-y-4">
            <p className={typography.small}>
              Design System v1.0 • Built with React, Tailwind CSS, and shadcn/ui
            </p>
            <div className="flex justify-center gap-4">
              <Badge variant="outline">React 18</Badge>
              <Badge variant="outline">TypeScript</Badge>
              <Badge variant="outline">Tailwind CSS</Badge>
              <Badge variant="outline">shadcn/ui</Badge>
              <Badge variant="outline">Rose Pine</Badge>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DesignSystem