"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

export default function Transactions() {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [categorizing, setCategorizing] = useState(false);
  const router = useRouter();

  const fetchTransactions = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("date", { ascending: false });

    if (!error) setTransactions(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, []);

  const handleAddTransaction = async (e) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: userData.user.id,
      amount: parseFloat(amount),
      type,
      category,
      description,
      date,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Transaction added successfully!");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate("");
      fetchTransactions();
    }
  };

  const handleAutoCategorize = async () => {
    if (!description) {
      setMessage("Please enter a description first");
      return;
    }

    setCategorizing(true);
    try {
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();

      if (data.category) {
        setCategory(data.category);
      } else {
        setMessage("Could not categorize: " + (data.error || "unknown error"));
      }
    } catch (error) {
      setMessage("Error calling AI: " + error.message);
    }
    setCategorizing(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) fetchTransactions();
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data.map((row) => ({
          user_id: userData.user.id,
          amount: parseFloat(row.amount),
          type: row.type,
          category: row.category,
          description: row.description || "",
          date: row.date,
        }));

        const { error } = await supabase.from("transactions").insert(rows);

        if (error) {
          setMessage("CSV import failed: " + error.message);
        } else {
          setMessage(`${rows.length} transactions imported successfully!`);
          fetchTransactions();
        }
      },
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Add Transaction</h1>
      <form onSubmit={handleAddTransaction}>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <br />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <br />

        <input
          type="text"
          placeholder="Category (e.g. Food, Rent)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
        <button
          type="button"
          onClick={handleAutoCategorize}
          disabled={categorizing}
        >
          {categorizing ? "Thinking..." : "Auto-Categorize with AI"}
        </button>
        <br />
        <br />

        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <br />

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <br />

        <button type="submit">Add Transaction</button>
      </form>
      <h2>Or Import from CSV</h2>
      <input type="file" accept=".csv" onChange={handleCSVUpload} />
      <p>{message}</p>

      <h2>Your Transactions</h2>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}>
              <td>{t.date}</td>
              <td>{t.type}</td>
              <td>{t.category}</td>
              <td>{t.description}</td>
              <td>{t.amount}</td>
              <td>
                <button onClick={() => handleDelete(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
