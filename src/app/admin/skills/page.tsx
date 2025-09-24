'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Download, Upload, Trash2, Edit } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Skill {
  id: string
  name: string
  category: string
  description: string
  lightcast_id?: string
  source: string
  source_version?: string
}

interface SkillAlias {
  skill_id: string
  alias: string
  skill_name?: string
}

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [aliases, setAliases] = useState<SkillAlias[]>([])
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [newAlias, setNewAlias] = useState('')
  const [loading, setLoading] = useState(true)
  const [isAddAliasOpen, setIsAddAliasOpen] = useState(false)

  useEffect(() => {
    loadSkills()
    loadAliases()
  }, [])

  const loadSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('name')

      if (error) throw error
      setSkills(data || [])
    } catch (error) {
      console.error('Error loading skills:', error)
      toast({
        title: "Error",
        description: "Failed to load skills",
        variant: "destructive"
      })
    }
  }

  const loadAliases = async () => {
    try {
      const { data, error } = await supabase
        .from('skill_aliases')
        .select(`
          skill_id,
          alias,
          skills!inner(name)
        `)
        .order('alias')

      if (error) throw error
      
      const aliasesWithSkillNames = data?.map((item: any) => ({
        skill_id: item.skill_id,
        alias: item.alias,
        skill_name: (item.skills as any)?.name
      })) || []
      
      setAliases(aliasesWithSkillNames)
      setLoading(false)
    } catch (error) {
      console.error('Error loading aliases:', error)
      setLoading(false)
      toast({
        title: "Error",
        description: "Failed to load aliases",
        variant: "destructive"
      })
    }
  }

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.source.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const skillAliases = selectedSkill 
    ? aliases.filter(alias => alias.skill_id === selectedSkill.id)
    : []

  const addAlias = async () => {
    if (!selectedSkill || !newAlias.trim()) return

    try {
      const { error } = await supabase
        .from('skill_aliases')
        .insert({
          skill_id: selectedSkill.id,
          alias: newAlias.trim()
        })

      if (error) throw error

      await loadAliases()
      setNewAlias('')
      setIsAddAliasOpen(false)
      
      toast({
        title: "Success",
        description: "Alias added successfully"
      })
    } catch (error) {
      console.error('Error adding alias:', error)
      toast({
        title: "Error",
        description: "Failed to add alias",
        variant: "destructive"
      })
    }
  }

  const removeAlias = async (skillId: string, alias: string) => {
    try {
      const { error } = await supabase
        .from('skill_aliases')
        .delete()
        .eq('skill_id', skillId)
        .eq('alias', alias)

      if (error) throw error

      await loadAliases()
      
      toast({
        title: "Success",
        description: "Alias removed successfully"
      })
    } catch (error) {
      console.error('Error removing alias:', error)
      toast({
        title: "Error",
        description: "Failed to remove alias",
        variant: "destructive"
      })
    }
  }

  const exportAliases = () => {
    const csvContent = [
      'skill_name,alias',
      ...aliases.map(alias => `"${alias.skill_name}","${alias.alias}"`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'skill_aliases.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const suggestDedupes = () => {
    const duplicates = skills.filter((skill, index, arr) => 
      arr.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase()) !== index
    )
    
    if (duplicates.length > 0) {
      toast({
        title: "Potential Duplicates Found",
        description: `Found ${duplicates.length} potential duplicate skills`,
      })
    } else {
      toast({
        title: "No Duplicates",
        description: "No potential duplicate skills found",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading skills and aliases...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Skills & Aliases Management</h1>
        <div className="flex gap-2">
          <Button onClick={exportAliases} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={suggestDedupes} variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Find Duplicates
          </Button>
        </div>
      </div>

      <Tabs defaultValue="skills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
          <TabsTrigger value="aliases">Aliases ({aliases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills Database</CardTitle>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Aliases</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSkills.map((skill) => {
                        const skillAliasCount = aliases.filter(a => a.skill_id === skill.id).length
                        return (
                          <TableRow 
                            key={skill.id}
                            className={selectedSkill?.id === skill.id ? 'bg-muted' : ''}
                          >
                            <TableCell className="font-medium">{skill.name}</TableCell>
                            <TableCell>{skill.category}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{skill.source}</Badge>
                            </TableCell>
                            <TableCell>{skillAliasCount}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSkill(skill)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-4">
                  {selectedSkill && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {selectedSkill.name}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{selectedSkill.source}</Badge>
                          <Badge variant="outline">{selectedSkill.category}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Description:</p>
                          <p className="text-sm">{selectedSkill.description || 'No description available'}</p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium">Aliases ({skillAliases.length})</p>
                            <Dialog open={isAddAliasOpen} onOpenChange={setIsAddAliasOpen}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Alias</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Input
                                    placeholder="Enter alias..."
                                    value={newAlias}
                                    onChange={(e) => setNewAlias(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addAlias()}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsAddAliasOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={addAlias}>Add Alias</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          <div className="space-y-2">
                            {skillAliases.map((alias) => (
                              <div key={alias.alias} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm">{alias.alias}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeAlias(alias.skill_id, alias.alias)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            {skillAliases.length === 0 && (
                              <p className="text-sm text-muted-foreground">No aliases defined</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aliases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Aliases</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alias</TableHead>
                    <TableHead>Skill Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aliases.map((alias) => (
                    <TableRow key={`${alias.skill_id}-${alias.alias}`}>
                      <TableCell className="font-medium">{alias.alias}</TableCell>
                      <TableCell>{alias.skill_name}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAlias(alias.skill_id, alias.alias)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
