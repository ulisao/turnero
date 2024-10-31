'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn, LogOut, Moon, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Field {
  id: string;
  name: string;
  size: number;
  pricePerHour: number;
}

interface Reservation {
  id: string;
  startTime: string;
  endTime: string;
}

export default function Component() {
  const { data: session } = useSession()
  const [fields, setFields] = useState<Field[]>([])
  const [selectedField, setSelectedField] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [showLoginAlert, setShowLoginAlert] = useState(false)
  const [reservedSlots, setReservedSlots] = useState<Reservation[]>([])
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setTheme('dark')
    fetchFields()
  }, [])

  useEffect(() => {
    if (selectedDate && selectedField) {
      fetchReservations()
    }
  }, [selectedDate, selectedField])

  const fetchFields = async () => {
    const response = await fetch('/api/fields')
    if (response.ok) {
      const data = await response.json()
      setFields(data)
      if (data.length > 0) {
        setSelectedField(data[0].id)
      }
    }
  }

  const fetchReservations = async () => {
    const date = selectedDate?.toISOString().split('T')[0]
    const response = await fetch(`/api/reservations?date=${date}&fieldId=${selectedField}`)
    if (response.ok) {
      const data = await response.json()
      setReservedSlots(data)
    }
  }

  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 15
    return `${hour.toString().padStart(2, '0')}:00`
  })

  const isReserved = (time: string) => {
    const [hour, minute] = time.split(':').map(Number)
    const startTime = new Date(selectedDate!)
    startTime.setHours(hour, minute, 0, 0)
    
    return reservedSlots.some(reservation => {
      const reservationStart = new Date(`${selectedDate?.toDateString()} ${reservation.startTime}`)
      const reservationEnd = new Date(`${selectedDate?.toDateString()} ${reservation.endTime}`)
      return startTime >= reservationStart && startTime < reservationEnd
    })
  }

  const handleReservation = async () => {
    if (!session) {
      setShowLoginAlert(true)
      return
    }

    const startTime = selectedTime!
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const endTime = `${(startHour + 1).toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`

    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: selectedDate?.toISOString().split('T')[0],
        startTime,
        endTime,
        fieldId: selectedField,
        userId: session.user.id,
      }),
    })

    if (response.ok) {
      alert('Reservation successful!')
      setSelectedTime(null)
      fetchReservations()
    } else {
      const error = await response.json()
      alert(`Reservation failed: ${error.error}`)
    }
  }

  const handleTimeSelection = (time: string) => {
    if (!session) {
      setShowLoginAlert(true)
    } else {
      setSelectedTime(time)
      setShowLoginAlert(false)
    }
  }

  const getFieldPrice = () => {
    const field = fields.find(f => f.id === selectedField)
    return field ? field.pricePerHour : 0
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="bg-card shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="font-bold text-xl">Soccer Field Reservations</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <>
                  <Button variant="ghost" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    Shifts
                  </Button>
                  <Button onClick={() => signOut()} size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button onClick={() => signIn()} size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold mb-6">Reserve a Soccer Field</h1>
          
          {showLoginAlert && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Authentication required</AlertTitle>
              <AlertDescription>
                Please log in to make a reservation.
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-6">
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name} ({field.size}-a-side)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-auto">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-4">Available Time Slots</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {timeSlots.map((time) => (
                  <Dialog key={time} open={selectedTime === time} onOpenChange={(open) => !open && setSelectedTime(null)}>
                    <DialogTrigger asChild>
                      <Button
                        variant={isReserved(time) ? "secondary" : "default"}
                        disabled={isReserved(time)}
                        className="w-full"
                        onClick={() => handleTimeSelection(time)}
                      >
                        {time}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Confirm Reservation</DialogTitle>
                        <DialogDescription>
                          Please review your reservation details before confirming.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="date" className="text-right">
                            Date
                          </Label>
                          <Input id="date" value={selectedDate?.toLocaleDateString()} className="col-span-3" readOnly />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="time" className="text-right">
                            Time
                          </Label>
                          <Input id="time" value={selectedTime || ''} className="col-span-3" readOnly />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="field" className="text-right">
                            Field
                          </Label>
                          <Input id="field" value={fields.find(f => f.id === selectedField)?.name || ''} className="col-span-3" readOnly />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="price" className="text-right">
                            Price
                          </Label>
                          <Input id="price" value={`$${getFieldPrice()} per hour`} className="col-span-3" readOnly />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" onClick={handleReservation}>
                          Confirm Reservation
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}