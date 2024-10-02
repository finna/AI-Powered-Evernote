'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { X, Plus, Tag, Edit2, Search, FileText } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import styles from '@/styles/NoteApp.module.css'

// Dynamic import for Quill
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

// Import Quill styles
import 'react-quill/dist/quill.snow.css'

type Note = {
  id: number
  title: string
  content: string
  tags: string[]
}

export function NoteAppComponent() {
  const [notes, setNotes] = useState<Note[]>([
    { id: 1, title: 'Welcome Note', content: 'Welcome to your new note-taking app!', tags: ['welcome', 'getting-started'] },
    { id: 2, title: 'Ideas', content: 'List of project ideas...', tags: ['projects', 'ideas'] },
  ])
  const [tags, setTags] = useState<string[]>(['welcome', 'getting-started', 'projects', 'ideas'])
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [summary, setSummary] = useState<string | null>(null)

  const filteredNotes = notes.filter(note => 
    (selectedTag ? note.tags.includes(selectedTag) : true) &&
    (searchTerm ? 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    : true)
  )

  const handleAddTag = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const newTag = event.currentTarget.tag.value.trim()
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      event.currentTarget.reset()
    }
  }

  const handleEditNote = (note: Note) => {
    setSelectedNote(note)
    setIsEditing(true)
  }

  const handleSaveNote = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedNote) {
      const formData = new FormData(event.currentTarget)
      const updatedNote = {
        ...selectedNote,
        title: formData.get('title') as string,
        content: formData.get('content') as string,
      }
      setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note))
      setIsEditing(false)
    }
  }

  const addNewNote = () => {
    const newNote: Note = {
      id: Date.now(),
      title: 'New Note',
      content: '',
      tags: [], // Add this line to include an empty tags array
    };
    setNotes([...notes, newNote]);
  };

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ]

  const handleSummarizeNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to summarize notes');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error summarizing notes:', error);
      // You might want to show an error message to the user here
    }
  }, [notes]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white p-4 border-r">
        <h2 className="text-xl font-bold mb-4">Tags</h2>
        <form onSubmit={handleAddTag} className="mb-4">
          <div className="flex space-x-2">
            <Input name="tag" placeholder="New tag" />
            <Button type="submit" size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
        </form>
        <div className="space-y-2">
          {tags.map(tag => (
            <Button
              key={tag}
              variant={selectedTag === tag ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              <Tag className="mr-2 h-4 w-4" />
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex flex-col space-y-4 mb-4">
          <h1 className="text-2xl font-bold">Notes</h1>
          <div className="flex space-x-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button onClick={addNewNote}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Note
            </Button>
            <Button onClick={handleSummarizeNotes}>
              <FileText className="mr-2 h-4 w-4" />
              Summarize Notes
            </Button>
          </div>
        </div>
        {summary && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{summary}</p>
            </CardContent>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <Card key={note.id}>
              <CardHeader>
                <CardTitle>{note.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="line-clamp-3" dangerouslySetInnerHTML={{ __html: note.content }} />
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex flex-wrap gap-1">
                  {note.tags.map(tag => (
                    <span key={tag} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleEditNote(note)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Note Modal */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveNote} className="space-y-4">
            <Input
              name="title"
              defaultValue={selectedNote?.title}
              placeholder="Note Title"
              className="w-full"
            />
            <div className={styles.quillWrapper}>
              <ReactQuill
                theme="snow"
                modules={modules}
                formats={formats}
                defaultValue={selectedNote?.content}
                onChange={(content) => {
                  if (selectedNote) {
                    setSelectedNote({ ...selectedNote, content })
                  }
                }}
              />
            </div>
            <input type="hidden" name="content" value={selectedNote?.content || ''} />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}