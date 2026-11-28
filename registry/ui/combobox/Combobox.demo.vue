<script setup lang="ts">
import { computed, ref } from 'vue'
import { Label } from '@/components/ui/label'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
} from '.'

const regions = [
  {
    heading: 'Europe',
    countries: [
      ['de', 'Germany'],
      ['fr', 'France'],
      ['it', 'Italy'],
      ['es', 'Spain'],
      ['pl', 'Poland'],
      ['se', 'Sweden'],
    ],
  },
  {
    heading: 'Africa',
    countries: [
      ['ci', 'Côte d’Ivoire'],
      ['ke', 'Kenya'],
      ['ng', 'Nigeria'],
    ],
  },
  {
    heading: 'Asia',
    countries: [
      ['jp', 'Japan'],
      ['vn', 'Vietnam'],
      ['in', 'India'],
      ['kr', 'South Korea'],
    ],
  },
] as const
const country = ref('de')

const languages = [
  ['en', 'English'],
  ['vi', 'Vietnamese'],
  ['fr', 'French'],
] as const
const sizes = [
  ['sm', 'Language'],
  ['md', 'Spoken language'],
  ['lg', 'Written language'],
] as const

// Stands in for results a server returns for the typed text.
const people = ['Ana Lima', 'Bao Tran', 'Chidi Okafor', 'Dana Cohen', 'Emil Berg']
const query = ref('')
const assignee = ref<string>()
// The field shows the chosen name after a choice, which isn't a search: list everyone then.
const results = computed(() => {
  const text = query.value.trim().toLowerCase()
  if (query.value === assignee.value) return people
  return people.filter((person) => person.toLowerCase().includes(text))
})
</script>

<template>
  <div class="flex max-w-content-narrow flex-col gap-gap-lg p-4">
    <div class="flex flex-col gap-gap-sm">
      <Label for="country">Country</Label>
      <Combobox v-model="country" name="country">
        <ComboboxInput id="country" placeholder="Search countries" />
        <ComboboxContent>
          <ComboboxGroup v-for="region in regions" :key="region.heading" :heading="region.heading">
            <ComboboxItem
              v-for="[code, name] in region.countries"
              :key="code"
              :value="code"
              :disabled="code === 'fr'"
            >
              {{ name }}
            </ComboboxItem>
          </ComboboxGroup>
          <ComboboxEmpty>No country matches.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
    <div v-for="[size, label] in sizes" :key="size" class="flex flex-col gap-gap-sm">
      <Label :for="`language-${size}`">{{ label }} ({{ size }})</Label>
      <Combobox>
        <ComboboxInput :id="`language-${size}`" :size="size" placeholder="Search languages" />
        <ComboboxContent>
          <ComboboxItem v-for="[code, name] in languages" :key="code" :value="code">
            {{ name }}
          </ComboboxItem>
          <ComboboxEmpty>No language matches.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="team">Team</Label>
      <Combobox>
        <ComboboxInput id="team" invalid aria-describedby="team-error" placeholder="Search teams" />
        <ComboboxContent>
          <ComboboxItem value="design">Design</ComboboxItem>
          <ComboboxItem value="sales">Sales</ComboboxItem>
          <ComboboxEmpty>No team matches.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
      <p id="team-error" class="text-sm text-muted-foreground">Choose a team to continue.</p>
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="office">Office</Label>
      <Combobox model-value="hcm" disabled>
        <ComboboxInput id="office" />
        <ComboboxContent>
          <ComboboxItem value="hcm">Ho Chi Minh City</ComboboxItem>
        </ComboboxContent>
      </Combobox>
    </div>
    <div class="flex flex-col gap-gap-sm">
      <Label for="assignee">Assignee</Label>
      <Combobox v-model="assignee" :filter="false">
        <ComboboxInput id="assignee" v-model="query" placeholder="Search people" />
        <ComboboxContent>
          <ComboboxItem v-for="person in results" :key="person" :value="person">
            {{ person }}
          </ComboboxItem>
          <ComboboxEmpty>No one matches.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  </div>
</template>
