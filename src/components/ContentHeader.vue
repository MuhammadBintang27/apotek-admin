<template>
  <!-- Legacy wrapper: tetap kompatibel dengan view lama yang masih pakai <ContentHeader>.
       Untuk view baru/yang sudah diupdate, pakai <AppPageHeader> langsung. -->
  <AppPageHeader
    :title="title"
    :icon="icon"
  >
    <template #actions v-if="$slots.actions">
      <slot name="actions" />
    </template>
  </AppPageHeader>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: null,
  },
})
</script>
