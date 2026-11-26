<script setup lang="ts">
// The landing page's showcase: real Heart UI components, as the CLI writes them, in a masonry of everyday
// screens. It runs in a DemoPreview frame like every demo, so the theme the landing page picks applies here.
import { ref } from 'vue'
import { Icon } from '@/lib/icon'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const email = ref('')
const role = ref('member')
const notify = ref(true)
const digest = ref(true)
const mentions = ref(true)
const updates = ref(false)
const plan = ref('team')
const bugTitle = ref('')
const bugSteps = ref('')
const shareLink = ref('https://example.com/invite/x8f2k')
const team = ['AL', 'GH', 'KJ', 'MH']
const pending = [
  { initials: 'GH', email: 'grace@example.com' },
  { initials: 'KJ', email: 'katherine@example.com' },
]
const plans = [
  { value: 'free', label: 'Free', price: '$0' },
  { value: 'team', label: 'Team', price: '$12 a seat' },
  { value: 'business', label: 'Business', price: '$24 a seat' },
]
</script>

<template>
  <!-- A masonry: cards flow down four columns on a wide screen, two on a tablet, one on a phone. -->
  <TooltipProvider>
    <div
      class="columns-1 gap-gap-lg p-1 md:columns-2 xl:columns-4 [&>*]:mb-gap-lg [&>*]:break-inside-avoid"
    >
      <Card as="section" aria-labelledby="sc-invite">
        <CardHeader>
          <CardTitle id="sc-invite" as="h2">Invite a teammate</CardTitle>
          <CardDescription>They get an email with a link to join.</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-gap-md">
          <div class="flex flex-col gap-gap-sm">
            <Label for="sc-email">Email</Label>
            <Input id="sc-email" v-model="email" type="email" placeholder="ada@example.com" />
          </div>
          <div class="flex flex-col gap-gap-sm">
            <Label for="sc-role">Role</Label>
            <Select v-model="role">
              <SelectTrigger id="sc-role" placeholder="Choose a role" />
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Checkbox v-model="notify">Send me a copy</Checkbox>
          <Separator />
          <ul class="flex flex-col gap-gap-md" aria-label="Pending invites">
            <li v-for="invite in pending" :key="invite.email" class="flex items-center gap-gap-sm">
              <Avatar>
                <AvatarFallback>{{ invite.initials }}</AvatarFallback>
              </Avatar>
              <span class="min-w-0 flex-1 truncate text-sm text-foreground">{{
                invite.email
              }}</span>
              <Badge variant="neutral">Pending</Badge>
            </li>
          </ul>
        </CardContent>
        <CardFooter class="justify-end">
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Send invite</Button>
        </CardFooter>
      </Card>

      <Card as="section" aria-labelledby="sc-faq">
        <CardHeader>
          <CardTitle id="sc-faq" as="h2">Billing questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion default-value="billed">
            <AccordionItem value="billed">
              <AccordionTrigger>When am I billed?</AccordionTrigger>
              <AccordionContent>On the first of each month, for the seats in use.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="export">
              <AccordionTrigger>Can I export my data?</AccordionTrigger>
              <AccordionContent>Yes, as CSV from Settings, at any time.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="cancel">
              <AccordionTrigger>Can I cancel any time?</AccordionTrigger>
              <AccordionContent>Yes. The plan runs to the end of the month.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Alert variant="success">
        <AlertTitle>Site published</AlertTitle>
        <AlertDescription>The redesign is live for everyone in the workspace.</AlertDescription>
      </Alert>

      <Card as="section" aria-labelledby="sc-plan">
        <CardHeader>
          <CardTitle id="sc-plan" as="h2">Plan</CardTitle>
          <CardDescription>Billed monthly. Change it any time.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup v-model="plan" aria-labelledby="sc-plan">
            <RadioGroupItem v-for="item in plans" :key="item.value" :value="item.value">
              <span class="flex w-full justify-between gap-gap-md">
                <span>{{ item.label }}</span>
                <span class="text-muted-foreground">{{ item.price }}</span>
              </span>
            </RadioGroupItem>
          </RadioGroup>
        </CardContent>
        <CardFooter class="justify-end">
          <Button variant="primary">Change plan</Button>
        </CardFooter>
      </Card>

      <Card as="section" aria-labelledby="sc-notify">
        <CardHeader>
          <CardTitle id="sc-notify" as="h2">Notifications</CardTitle>
          <CardDescription>What we email you about.</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-gap-md">
          <Switch v-model="digest">Daily digest</Switch>
          <Separator />
          <Switch v-model="mentions">Mentions</Switch>
          <Separator />
          <Switch v-model="updates">Product updates</Switch>
        </CardContent>
      </Card>

      <Card as="section" aria-labelledby="sc-launch">
        <CardHeader class="flex-row items-start justify-between gap-gap-md">
          <div class="flex flex-col gap-gap-sm">
            <CardTitle id="sc-launch" as="h2">Q4 launch</CardTitle>
            <CardDescription>18 of 24 tasks done.</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" aria-label="Q4 launch actions">
                <Icon name="chevron-down" class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Project</DropdownMenuLabel>
              <DropdownMenuItem>
                <template #leading><Icon name="add" class="size-4" /></template>
                New task
              </DropdownMenuItem>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent class="flex flex-col gap-gap-md">
          <Progress :model-value="75" aria-labelledby="sc-launch" />
          <div class="flex flex-wrap gap-gap-sm">
            <Badge variant="info">Design</Badge>
            <Badge variant="warning">Due Friday</Badge>
          </div>
        </CardContent>
      </Card>

      <Card as="section" aria-labelledby="sc-bug">
        <CardHeader>
          <CardTitle id="sc-bug" as="h2">Report a bug</CardTitle>
          <CardDescription>Help us fix issues faster.</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-gap-md">
          <div class="flex flex-col gap-gap-sm">
            <Label for="sc-bug-title">Title</Label>
            <Input id="sc-bug-title" v-model="bugTitle" placeholder="What went wrong" />
          </div>
          <div class="flex flex-col gap-gap-sm">
            <Label for="sc-bug-steps">Steps to reproduce</Label>
            <Textarea id="sc-bug-steps" v-model="bugSteps" placeholder="1. Go to… 2. Click…" />
          </div>
        </CardContent>
        <CardFooter class="justify-end">
          <Button variant="primary">Submit</Button>
        </CardFooter>
      </Card>

      <Card as="section" aria-labelledby="sc-team">
        <CardHeader class="flex-row items-start justify-between gap-gap-md">
          <div class="flex flex-col gap-gap-sm">
            <CardTitle id="sc-team" as="h2">Team</CardTitle>
            <CardDescription>Four members, 12 seats.</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm">Share</Button>
            </PopoverTrigger>
            <PopoverContent align="end">
              <div class="flex flex-col gap-gap-md">
                <div class="flex flex-col gap-gap-sm">
                  <Label for="sc-share">Invite link</Label>
                  <Input id="sc-share" v-model="shareLink" readonly />
                </div>
                <PopoverClose as-child>
                  <Button size="sm" class="self-end">Done</Button>
                </PopoverClose>
              </div>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent class="flex items-center justify-between gap-gap-md">
          <div class="flex -space-x-2">
            <Avatar v-for="initials in team" :key="initials" class="ring-2 ring-surface">
              <AvatarFallback>{{ initials }}</AvatarFallback>
            </Avatar>
          </div>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="ghost" size="sm" aria-label="About seats">
                <Icon name="info" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Seats are billed monthly.</TooltipContent>
          </Tooltip>
        </CardContent>
      </Card>

      <Card as="section" aria-labelledby="sc-project">
        <CardHeader>
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="#projects">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Marketing</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
          <CardTitle id="sc-project" as="h2">Website redesign</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs default-value="overview">
            <TabsList aria-label="Project">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" class="pt-gap-md text-sm text-muted-foreground">
              Three tasks are due this week; the launch checklist is 80% done.
            </TabsContent>
            <TabsContent value="activity" class="pt-gap-md text-sm text-muted-foreground">
              Ada commented on the launch plan.
            </TabsContent>
            <TabsContent value="settings" class="pt-gap-md text-sm text-muted-foreground">
              Visible to everyone in the workspace.
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card as="section" aria-labelledby="sc-activity">
        <CardHeader>
          <CardTitle id="sc-activity" as="h2">Recent activity</CardTitle>
          <CardDescription>Loading the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent aria-busy="true" class="flex flex-col gap-gap-md">
          <div v-for="row in 3" :key="row" class="flex items-center gap-gap-sm">
            <Skeleton class="size-control-md shrink-0 rounded-full" />
            <div class="flex flex-1 flex-col gap-gap-sm">
              <Skeleton class="h-3 w-3/4" />
              <Skeleton class="h-3 w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert variant="warning">
        <AlertTitle>Seats almost full</AlertTitle>
        <AlertDescription
          >11 of 12 seats are in use. Add seats before inviting more.</AlertDescription
        >
      </Alert>

      <Card as="section" aria-labelledby="sc-storage">
        <CardHeader>
          <CardTitle id="sc-storage" as="h2">Storage</CardTitle>
          <CardDescription>6.5 of 10 GB used.</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-gap-md">
          <Progress :model-value="65" aria-labelledby="sc-storage" />
          <div class="flex flex-wrap gap-gap-sm">
            <Badge variant="success">Paid</Badge>
            <Badge variant="neutral">EU</Badge>
          </div>
        </CardContent>
      </Card>

      <Card as="section" aria-labelledby="sc-danger">
        <CardHeader>
          <CardTitle id="sc-danger" as="h2">Delete project</CardTitle>
          <CardDescription>Removes the project and its files for everyone.</CardDescription>
        </CardHeader>
        <CardFooter class="justify-end">
          <Dialog>
            <DialogTrigger as-child>
              <Button variant="danger">Delete project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Website redesign?</DialogTitle>
                <DialogDescription>
                  This removes the project and its files for everyone. It can't be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose as-child><Button variant="ghost">Cancel</Button></DialogClose>
                <DialogClose as-child><Button variant="danger">Delete</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  </TooltipProvider>
</template>
