<script setup lang="ts">
// The landing page's showcase: real Heart UI components, as the CLI writes them, in a bento grid.
// It runs in a DemoPreview frame like every demo, so the theme the landing page picks applies here.
import { ref } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const email = ref('')
const role = ref('member')
const digest = ref(true)
const mentions = ref(true)
const updates = ref(false)
const notify = ref(true)
const team = ['AL', 'GH', 'KJ', 'MH']
const pending = [
  { initials: 'GH', email: 'grace@example.com' },
  { initials: 'KJ', email: 'katherine@example.com' },
]
</script>

<template>
  <!-- A bento grid: a large form tile, a wide settings tile, two small tiles, then a wide tabs tile and an
       alert. One column on a phone. -->
  <div class="grid grid-flow-dense grid-cols-1 gap-gap-lg p-6 md:grid-cols-4">
    <Card as="section" aria-labelledby="sc-invite" class="md:col-span-2 md:row-span-2">
      <CardHeader>
        <CardTitle id="sc-invite" as="h2">Invite a teammate</CardTitle>
        <CardDescription>They get an email with a link to join.</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-1 flex-col gap-gap-md">
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
            <span class="min-w-0 flex-1 truncate text-sm text-foreground">{{ invite.email }}</span>
            <Badge variant="neutral">Pending</Badge>
          </li>
        </ul>
      </CardContent>
      <CardFooter class="justify-end">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Send invite</Button>
      </CardFooter>
    </Card>

    <Card as="section" aria-labelledby="sc-notify" class="md:col-span-2">
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

    <Card as="section" aria-labelledby="sc-team">
      <CardHeader>
        <CardTitle id="sc-team" as="h2">Team</CardTitle>
        <CardDescription>Four members.</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-gap-md">
        <div class="flex -space-x-2">
          <Avatar v-for="initials in team" :key="initials" class="ring-2 ring-surface">
            <AvatarFallback>{{ initials }}</AvatarFallback>
          </Avatar>
        </div>
        <Badge variant="info" class="self-start">12 seats</Badge>
      </CardContent>
    </Card>

    <Card as="section" aria-labelledby="sc-project" class="md:col-span-3">
      <CardHeader>
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

    <Alert variant="success">
      <AlertTitle>Site published</AlertTitle>
      <AlertDescription>The redesign is live for everyone in the workspace.</AlertDescription>
    </Alert>
  </div>
</template>
