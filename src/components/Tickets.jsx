import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Tickets.css";

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    ticket_type: "",
    price: "",
    status: "",
    event_id: "",
  });
  const [editingTicket, setEditingTicket] = useState(null);
  const [error, setError] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchEvents();
    checkAdminStatus();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5555/tickets");
      setTickets(response.data);
    } catch (error) {
      console.error("Error fetching tickets", error);
    }
  };

  const fetchEvents = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("http://127.0.0.1:5555/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events", error);
    }
  };

  const checkAdminStatus = () => {
    const token = localStorage.getItem("token");
    fetch("http://127.0.0.1:5555/check_admin", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setIsAdmin(data.is_admin);
      })
      .catch((error) => {
        console.error("Error checking admin status:", error);
      });
  };

  const validateEventId = (event_id) => {
    return events.some((event) => event.id === parseInt(event_id));
  };

  const createTicket = async () => {
    if (!validateEventId(form.event_id)) {
      setError("Event ID not found");
      return;
    }
    try {
      const response = await axios.post("http://127.0.0.1:5555/tickets", form);
      setTickets([...tickets, response.data.ticket]);
      setForm({ ticket_type: "", price: "", status: "", event_id: "" });
      setError(null);
    } catch (error) {
      console.error("Error creating ticket", error);
    }
  };

  const updateTicket = async (id) => {
    if (!validateEventId(form.event_id)) {
      setError("Event ID not found");
      return;
    }
    try {
      const response = await axios.patch(
        `http://127.0.0.1:5555/tickets/${id}`,
        form
      );
      const updatedTicket = response.data.ticket;
      const updatedTickets = tickets.map((ticket) =>
        ticket.id === id ? updatedTicket : ticket
      );
      setTickets(updatedTickets);
      setEditingTicket(null);
      setForm({ ticket_type: "", price: "", status: "", event_id: "" });
      setError(null);
    } catch (error) {
      console.error("Error updating ticket", error);
    }
  };

  const deleteTicket = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5555/tickets/${id}`);
      const filteredTickets = tickets.filter((ticket) => ticket.id !== id);
      setTickets(filteredTickets);
    } catch (error) {
      console.error("Error deleting ticket", error);
    }
  };

  const buyTicket = async (ticketId) => {
    try {
      const userId = prompt("Enter your user ID:");
      if (!userId) {
        alert("User ID is required.");
        return;
      }
      const userExists = await validateInput("users", userId);
      if (!userExists) {
        alert(`User with ID ${userId} does not exist.`);
        return;
      }

      const enteredPrice = prompt("Enter the price for this ticket:");
      if (!enteredPrice) {
        alert("Price is required.");
        return;
      }

      const status = prompt(
        "Enter the status for this transaction (e.g., pending, completed):"
      );
      if (!status) {
        alert("Status is required.");
        return;
      }

      const eventId = prompt(
        "Enter the event ID for which you are buying the ticket:"
      );
      if (!eventId) {
        alert("Event ID is required.");
        return;
      }
      const eventExists = await validateInput("events", eventId);
      if (!eventExists) {
        alert(`Event with ID ${eventId} does not exist.`);
        return;
      }

      const ticketExists = await validateInput("tickets", ticketId);
      if (!ticketExists) {
        alert(`Ticket with ID ${ticketId} does not exist.`);
        return;
      }

      alert("Your request has been received.");

      await axios.post(`http://127.0.0.1:5555/buy-ticket/${ticketId}`, {
        ticket_id: ticketId,
        user_id: userId,
        status: status,
        price: enteredPrice,
        event_id: eventId,
      });

      alert("Ticket purchased successfully.");
    } catch (error) {
      console.error("Error purchasing ticket:", error);
      alert("Failed to purchase ticket. Please try again later.");
    }
  };

  const validateInput = async (entity, id) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(
        `http://127.0.0.1:5555/${entity}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return !!response.data;
    } catch (error) {
      console.error(
        `Error checking existence of ${entity} with ID ${id}:`,
        error
      );
      return false;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTicket) {
      updateTicket(editingTicket);
    } else {
      createTicket();
    }
  };

  const handleEdit = (ticket) => {
    setForm({
      ticket_type: ticket.ticket_type,
      price: ticket.price,
      status: ticket.status,
      event_id: ticket.event_id,
    });
    setEditingTicket(ticket.id);
  };

  const getEventDetails = (eventId) => {
    const event = events.find((event) => event.id === parseInt(eventId));
    return event
      ? {
          title: event.title,
          location: event.location,
          date_time: event.date_time,
          description: event.description,
        }
      : {};
  };

  const toggleDescription = (id) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div>
      <h2>Tickets</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {isAdmin && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="ticket_type"
            value={form.ticket_type}
            onChange={handleChange}
            placeholder="Ticket Type"
          />
          <input
            type="text"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Price"
          />
          <input
            type="text"
            name="status"
            value={form.status}
            onChange={handleChange}
            placeholder="Status"
          />
          <input
            type="text"
            name="event_id"
            value={form.event_id}
            onChange={handleChange}
            placeholder="Event ID"
          />
          <button type="submit">
            {editingTicket ? "Update Ticket" : "Create Ticket"}
          </button>
        </form>
      )}
      <div className="card-container">
        {tickets.map((ticket) => {
          const eventDetails = getEventDetails(ticket.event_id);
          const isExpanded = expandedDescriptions[ticket.id];
          const shortDescription = eventDetails.description
            ? eventDetails.description.slice(0, 100)
            : "";
          return (
            <div key={ticket.id} className="card">
              <h3>{eventDetails.title}</h3>
              <p>{eventDetails.location}</p>
              <p>{new Date(eventDetails.date_time).toLocaleString()}</p>
              <p>
                {isExpanded ? eventDetails.description : shortDescription}
                {eventDetails.description &&
                  eventDetails.description.length > 100 && (
                    <button onClick={() => toggleDescription(ticket.id)}>
                      {isExpanded ? "Show Less" : "View More"}
                    </button>
                  )}
              </p>
              {isAdmin && (
                <>
                  <button onClick={() => handleEdit(ticket)}>Edit</button>
                  <button onClick={() => deleteTicket(ticket.id)}>
                    Delete
                  </button>
                </>
              )}
              {!isAdmin && (
                <button onClick={() => buyTicket(ticket.id)}>Buy Ticket</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tickets;
