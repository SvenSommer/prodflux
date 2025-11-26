import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TransferTodo } from '../../models/todos/transfer-todo';

export interface TransferTodosDialogData {
  transferTodos: TransferTodo[];
  onToggleDone: (todoId: string) => void;
  onDelete: (todoId: string) => void;
}

@Component({
  selector: 'app-transfer-todos-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule
  ],
  templateUrl: './transfer-todos-dialog.component.html',
  styleUrl: './transfer-todos-dialog.component.scss'
})
export class TransferTodosDialogComponent {
  displayedColumns: string[] = ['material', 'fromTo', 'quantity', 'done', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<TransferTodosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransferTodosDialogData
  ) {}

  toggleTodoDone(todoId: string): void {
    this.data.onToggleDone(todoId);
  }

  deleteTodo(todoId: string): void {
    this.data.onDelete(todoId);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  onCreateTransfers(): void {
    this.dialogRef.close('create');
  }
}
