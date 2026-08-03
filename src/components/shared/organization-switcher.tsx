'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Database } from '@/types/supabase'
import { createOrganization } from '@/server/actions/organizations'

type Organization = any

interface OrganizationSwitcherProps {
  organizations: Organization[]
}

export function OrganizationSwitcher({ organizations }: OrganizationSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const [showNewOrgDialog, setShowNewOrgDialog] = React.useState(false)
  
  // In a real app, this state would be synced with URL, Cookie, or Context
  const [activeOrg, setActiveOrg] = React.useState<Organization | null>(
    organizations.length > 0 ? organizations[0] : null
  )

  return (
    <Dialog open={showNewOrgDialog} onOpenChange={setShowNewOrgDialog}>
      <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select an organization"
          className="w-[200px] justify-between"
        >
          {activeOrg ? activeOrg.name : 'Select organization...'}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search organization..." />
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup heading="Organizations">
              {organizations.map((org) => (
                <CommandItem
                  key={org.id}
                  onSelect={() => {
                    setActiveOrg(org)
                    setOpen(false)
                    // Trigger context change (e.g., set cookie, reload page)
                  }}
                  className="text-sm"
                >
                  {org.name}
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      activeOrg?.id === org.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          <CommandSeparator />
          <CommandList>
            <CommandGroup>
              <DialogTrigger asChild>
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setShowNewOrgDialog(true)
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Organization
                </CommandItem>
              </DialogTrigger>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Add a new organization to manage clients and stores.
          </DialogDescription>
        </DialogHeader>
        <form action={createOrganization}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" name="name" placeholder="Acme Inc." required />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setShowNewOrgDialog(false)}>
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
