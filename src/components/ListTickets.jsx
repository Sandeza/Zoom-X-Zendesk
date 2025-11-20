import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTicketsByPhone } from '../store/commonSlice'
import CreateTicket from './createTicket'
import { setUsername } from '../store/username'

export default function ListTickets({ client }) {
  // Redux and local states
  const [tickets, setTickets] = useState([])
  const callData = useSelector((state) => state.common.callData)
  const callerNumber = callData?.callerNumber
  const callerName = callData?.callerName
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateTicket, setShowCreateTicket] = useState(false)
  const [noteTicketId, setNoteTicketId] = useState(null)
  const [noteText, setNoteText] = useState('')
  const dispatch = useDispatch()
  const [hoveredTicket, setHoveredTicket] = useState(null)
  const user = useSelector((state) => state.common.single_contact)||"Unknown"
  const username = user.name||"Unknown"
  // Only dispatch when username changes
  useEffect(() => {
    if (username) {
      dispatch(setUsername(username))
    }
  }, [username, dispatch])
  // console.log('Caller Name:', callerName);
  console.log('Username from Redux:', username)
  // console.log('User from Redux:', user)
  // const userId =  user?.id||user[0]?.id

  // console.log('User ID from Redux:', userId)
  const darkMode = useSelector((state) => state.ui?.darkMode) || false // assuming darkMode is here

  useEffect(() => {
    if (!client || !callerNumber) {
      setError('Missing client or caller number')
      setLoading(false)
      return
    }
    // async function loadTickets() {
    //   setLoading(true)
    //   setError('')
    //   try {
    //     const resultAction = await dispatch(fetchTicketsByPhone(callerNumber))
    //     if (fetchTicketsByPhone.fulfilled.match(resultAction)) {
    //       setTickets(resultAction.payload)
    //     } else {
    //       throw new Error(resultAction.payload || 'Failed to fetch tickets')
    //     }
    //   } catch (err) {
    //     setError('Failed to load tickets: ' + (err.message || 'Unknown error'))
    //     console.log("from list ticket",err)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    async function loadTickets() {
      setLoading(true)
      setError('')
      try {
        const resultAction = await dispatch(fetchTicketsByPhone(callerNumber))
        if (fetchTicketsByPhone.fulfilled.match(resultAction)) {
          const fetchedTickets = resultAction.payload
          if (fetchedTickets.length === 0) {
            setTickets([]) // empty list, show "No tickets found"
          } else {
            setTickets(fetchedTickets)
          }
        } else {
          throw new Error(resultAction.payload || 'Failed to fetch tickets')
        }
      } catch (err) {
        // only set error for real failures (not just empty results)
        setError(err.message.includes('Not found') ? '' : 'Failed to load tickets')
        setTickets([]) // ensure tickets resets to []
      } finally {
        setLoading(false)
      }
    }

    loadTickets()
  }, [client, callerNumber, dispatch])

  const createNote = async (ticketId) => {
    if (!ticketId) return
    if (!noteText.trim()) return console.log('Please enter a note before submitting.')
    try {
      await client.request({
        url: `/api/v2/tickets/${ticketId}.json`,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ ticket: { comment: { body: noteText, public: false } } })
      })
      console.log('Note added successfully!alert')
      setNoteTicketId(null)
      setNoteText('')
    } catch (err) {
      console.log('Failed to add note: ' + (err.message || 'Unknown error'))
    }
  }

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'new':
        return { background: '#FFA500', color: '#fff' } // orange
      case 'open':
        return { background: '#FF4136', color: '#fff' } // red
      case 'pending':
        return { background: '#007BFF', color: '#fff' } // blue
      case 'onhold':
        return { background: '#4A4A48', color: '#fff' } // dark grey
      case 'solved':
        return { background: '#D3D3D3', color: '#000' } // light grey
      default:
        return { background: '#e2e3e5', color: '#000' } // default grey
    }
  }

  const openTicketInBackground = (ticketId) => {
    if (!ticketId) return
    client.invoke('routeTo', 'ticket', ticketId)
  }

  const openContactInBackground = (contactId) => {
    if (!contactId) return
    console.log('Attempting to open contact:', contactId, user.id)
    client.invoke('routeTo', 'user', user.id)
  }

  if (loading) return <p style={{ padding: 12 }}>Loading tickets...</p>
  // if (error)
  //   return (
  //     <p style={{ padding: 12, color: 'var(--danger)' }}>
  //       {error}
  //     </p>
  //   )
  if (showCreateTicket)
    return (
      <CreateTicket
        client={client}
        onClose={() => setShowCreateTicket(false)}
        onTicketCreated={(ticket) => setTickets([ticket, ...tickets])}
      />
    )

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        fontFamily: 'Segoe UI, sans-serif',
        background: 'var(--background)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Caller Info */}
      {/* Caller Info */}
      <div
        style={{
          position: 'relative', // for positioning the button
          width: '100%',
          background: darkMode ? 'var(--surface)' : 'var(--background)',
          color: 'var(--text-primary)',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          fontFamily: 'Segoe UI, sans-serif',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#f0f0f0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 28,
            fontWeight: 'bold',
            color: '#555',
            flexShrink: 0
          }}
        >
          {username ? username[0].toUpperCase() : callerName ? callerName[0].toUpperCase() : '?'}
        </div>

        {/* Caller Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{username || callerName || 'Unknown Caller'}</div>
          <div style={{ fontSize: 14, color: '#666' }}>{callerNumber || '-'}</div>
          <div
            style={{
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 500,
              color: '#28a745'
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#28a745',
                display: 'inline-block'
              }}
            ></span>
            Connected
          </div>
        </div>

        {/* + Ticket button in bottom-right corner */}
        <button
          onClick={() => setShowCreateTicket(true)}
          style={{
            position: 'absolute',
            bottom: 8,
            right: 38,
            padding: '8px 16px',
            borderRadius: 24,
            fontSize: 14,
            fontWeight: 600,
            border: '1px solid #4b6cb7',
            cursor: 'pointer',
            background: '#4b6cb7',
            color: '#fff',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#3a549a'
            e.currentTarget.style.borderColor = '#3a549a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#4b6cb7'
            e.currentTarget.style.borderColor = '#4b6cb7'
          }}
        >
          + Ticket
        </button>
      </div>

      {/* Tickets List */}
      {/* Tickets Section */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            List Of Tickets
            {/* {tickets.length > 0 && (
              <span
                style={{
                  background: 'var(--tab-button-active-bg)',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: 12,
                  padding: '2px 8px',
                  fontWeight: 500
                }}
              >
                {tickets.length}
              </span>
            )} */}
          </h3>
        </div>

        {/* Divider Line */}
        <div
          style={{
            height: 1,
            background: 'rgba(0,0,0,0.1)',
            marginBottom: 12
          }}
        ></div>

        {/* Ticket List or Empty State */}
        {tickets.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-secondary)',
              marginTop: 40,
              fontSize: 14,
              opacity: 0.8
            }}
          >
            <p>No tickets found for this contact.</p>
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                style={{
                  position: 'relative',
                  background: 'var(--surface)',
                  borderRadius: 10,
                  padding: 16,
                  boxShadow: '0 3px 8px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onClick={() => openTicketInBackground(ticket.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 5px 12px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.08)'
                }}
              >
                {/* Ticket Title + ID */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
                    {ticket.subject || 'Untitled Ticket'}
                  </strong>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      background: 'rgba(0,0,0,0.05)',
                      padding: '2px 6px',
                      borderRadius: 6,
                      fontWeight: 500
                    }}
                    title={`Ticket ID: ${ticket.id}`}
                  >
                    #{ticket.id}
                  </span>
                </div>

                {/* Ticket Badges */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    fontSize: 11,
                    alignItems: 'center',
                    marginTop: 4,
                    flexWrap: 'wrap'
                  }}
                >
                  <span
                    style={{
                      background: getStatusColor(ticket.status).background,
                      color: getStatusColor(ticket.status).color,
                      padding: '2px 6px',
                      borderRadius: 10,
                      fontWeight: 500,
                      textTransform: 'capitalize',
                      transition: 'all 0.2s ease'
                    }}
                    title={ticket.status}
                  >
                    {ticket.status}
                  </span>
                  {/* Priority Badge */}
                  <span
                    style={{
                      background:
                        ticket.priority?.toLowerCase() === 'urgent'
                          ? 'linear-gradient(135deg, #ff4b2b, #ff416c)'
                          : ticket.priority?.toLowerCase() === 'high'
                            ? 'linear-gradient(135deg, #f7971e, #ffd200)'
                            : ticket.priority?.toLowerCase() === 'medium'
                              ? 'linear-gradient(135deg, #36d1dc, #5b86e5)'
                              : ticket.priority?.toLowerCase() === 'low'
                                ? 'linear-gradient(135deg, #56ab2f, #a8e063)'
                                : 'linear-gradient(135deg, #bdc3c7, #2c3e50)',
                      color: '#fff',
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontWeight: 600,
                      fontSize: 12,
                      textTransform: 'capitalize',
                      letterSpacing: '0.3px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                    }}
                    title={`Priority: ${ticket.priority || 'Normal'}`}
                  >
                    {ticket.priority || 'Normal'}
                  </span>
                </div>
                {/* Add Note Button (top-right) */}
                {!noteTicketId && (
                  <div style={{ position: 'absolute', top: 45, right: 15 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setNoteTicketId(ticket.id)
                      }}
                      style={{
                        background: 'var(--tab-button-active-bg)',
                        border: 'none',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: 6,
                        transition: 'all 0.2s ease',
                        userSelect: 'none'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.85)}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
                      title="Add Note"
                      type="button"
                    >
                      + Note
                    </button>
                  </div>
                )}

                {/* Note textarea */}
                {noteTicketId === ticket.id && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <textarea
                      rows={2}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Write a note..."
                      style={{
                        width: '100%',
                        padding: 8,
                        borderRadius: 12,
                        fontSize: 13,
                        border: '1px solid var(--input-border)',
                        resize: 'none',
                        outline: 'none',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => createNote(ticket.id)}
                        style={{
                          padding: '6px 16px',
                          background: '#28a745', // Green background for Save
                          color: '#fff', // White text
                          border: '1px solid #28a745', // border to make it more button-like
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#218838'
                          e.currentTarget.style.borderColor = '#218838'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#28a745'
                          e.currentTarget.style.borderColor = '#28a745'
                        }}
                        type="button"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => {
                          setNoteTicketId(null)
                          setNoteText('')
                        }}
                        style={{
                          padding: '6px 16px',
                          background: '#f8f9fa', // Light grey background for Cancel
                          color: '#212529', // Dark text
                          border: '1px solid #ced4da',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: 500,
                          transition: 'all 0.2s ease',
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#e2e6ea'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f8f9fa'
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
