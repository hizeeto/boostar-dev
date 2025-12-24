"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  label,
  className,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon | string
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
  label?: string
  className?: string
}) {
  return (
    <SidebarGroup className={className}>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          // 하위 메뉴가 없으면 단일 메뉴로 표시
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                  <a href={item.url} className="group/item">
                    {item.icon && (
                      typeof item.icon === 'string' ? (
                        <span 
                          className={`w-5 h-5 inline-block transition-colors ${
                            item.isActive ? 'bg-primary' : 'bg-sidebar-foreground'
                          }`}
                          style={{
                            WebkitMaskImage: `url(${item.icon})`,
                            WebkitMaskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskImage: `url(${item.icon})`,
                            maskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center',
                          }}
                        />
                      ) : (
                        <item.icon className={`w-5 h-5 transition-colors ${item.isActive ? 'text-primary' : ''}`} />
                      )
                    )}
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }
          
          // 하위 메뉴가 있으면 Collapsible로 표시
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} isActive={item.isActive}>
                    {item.icon && (
                      typeof item.icon === 'string' ? (
                        <span 
                          className={`w-5 h-5 inline-block transition-colors ${
                            item.isActive ? 'bg-primary' : 'bg-sidebar-foreground'
                          }`}
                          style={{
                            WebkitMaskImage: `url(${item.icon})`,
                            WebkitMaskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskImage: `url(${item.icon})`,
                            maskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center',
                          }}
                        />
                      ) : (
                        <item.icon className={`w-5 h-5 transition-colors ${item.isActive ? 'text-primary' : ''}`} />
                      )
                    )}
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
