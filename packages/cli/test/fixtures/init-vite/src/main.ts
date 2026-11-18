import './style.css'
import { cn } from '@/lib/utils/utils'

document.querySelector('#app')?.setAttribute('class', cn('bg-primary', 'text-primary-foreground'))
