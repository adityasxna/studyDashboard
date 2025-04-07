import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Badge } from 'react-bootstrap';
import { FaTrash, FaHistory } from 'react-icons/fa';
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';

const Tasklog = ({ show, handleClose }) => {
  const [taskHistory, setTaskHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      fetchTaskHistory();
    }
  }, [show]);

  const fetchTaskHistory = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "tasks"),
        where("userId", "==", auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const tasks = [];
      querySnapshot.forEach((doc) => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      setTaskHistory(tasks);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
    }
    setLoading(false);
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      setTaskHistory(taskHistory.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task: ", error);
    }
  };

  const deleteAllTasks = async () => {
    try {
      const batch = writeBatch(db);  // Now properly defined
      taskHistory.forEach(task => {
        batch.delete(doc(db, "tasks", task.id));
      });
      await batch.commit();
      setTaskHistory([]);
    } catch (error) {
      console.error("Error deleting all tasks: ", error);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Task History</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : taskHistory.length === 0 ? (
          <div className="text-center text-muted">No task history found</div>
        ) : (
          <ListGroup variant="flush">
            {taskHistory.map((task) => (
              <ListGroup.Item key={task.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <span className={task.completed ? "text-decoration-line-through" : ""}>
                    {task.text}
                  </span>
                  <Badge bg={task.completed ? "success" : "warning"} className="ms-2">
                    {task.completed ? "Completed" : "Pending"}
                  </Badge>
                </div>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  onClick={() => deleteTask(task.id)}
                >
                  <FaTrash />
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={deleteAllTasks} disabled={taskHistory.length === 0}>
          Delete All Logs
        </Button>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Tasklog;