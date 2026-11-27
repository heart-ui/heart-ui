<script setup lang="ts">
import { ref } from 'vue'
import { Pagination } from '.'

const first = ref(1)
const middle = ref(10)
const last = ref(20)
</script>

<template>
  <div class="flex flex-col gap-gap-lg p-4">
    <Pagination v-model:page="first" :total="200" nav-label="Orders pages" />
    <Pagination v-model:page="middle" :total="200" nav-label="Invoices pages" />
    <Pagination v-model:page="last" :total="200" nav-label="Customers pages" />
  </div>
</template>
