import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface ListItem {
  id: string
  title: string
  description: string
  href: string
}

interface ListCardProps {
  title: string
  description: string
  items: ListItem[]
  viewAllHref: string
  className?: string
}

export function ListCard({ 
  title, 
  description, 
  items, 
  viewAllHref,
  className = ""
}: ListCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={viewAllHref} className="text-teal-600 hover:text-teal-700" onClick={() => window.scrollTo(0, 0)}>
              View All →
            </Link>
          </Button>
        </div>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{item.title}</h4>
                <p className="text-xs text-gray-600">{item.description}</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={item.href} className="text-teal-600 hover:text-teal-700 text-xs" onClick={() => window.scrollTo(0, 0)}>
                  Details →
                </Link>
              </Button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No items saved yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
