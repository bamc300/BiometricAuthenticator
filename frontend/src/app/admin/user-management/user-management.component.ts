import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/models/user.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  userForm: FormGroup;
  isEditMode: boolean = false;
  selectedUserId: string | null = null;
  loading: boolean = true;
  actionLoading: boolean = false;
  error: string = '';
  success: string = '';
  isOffline: boolean = !navigator.onLine;
  searchTerm: string = '';
  showModal: boolean = false;
  deleteUserId: string | null = null;
  
  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder
  ) {
    this.userForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      roles: [['USER'], [Validators.required]],
      biometricEnabled: [false]
    });
  }

  ngOnInit(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOffline = false;
      this.loadUsers();
    });
    window.addEventListener('offline', () => this.isOffline = true);
    
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    
    if (this.isOffline) {
      this.error = 'User management is not available in offline mode.';
      this.loading = false;
      return;
    }
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = [...users];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users.';
        console.error('User loading error:', err);
        this.loading = false;
      }
    });
  }
  
  onSearch(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }
    
    this.filteredUsers = this.users.filter(user => 
      user.username.toLowerCase().includes(term) ||
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  }
  
  onAddUser(): void {
    this.isEditMode = false;
    this.selectedUserId = null;
    this.resetForm();
    // Enable password field for new users
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.get('username')?.enable();
    this.userForm.get('email')?.enable();
  }
  
  onEditUser(user: User): void {
    this.isEditMode = true;
    this.selectedUserId = user.id;
    
    // Populate form
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      roles: user.roles,
      biometricEnabled: user.biometricEnabled
    });
    
    // Make password optional for edits
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.setValidators(Validators.minLength(6));
    this.userForm.get('password')?.updateValueAndValidity();
    
    // Disable username and email changes
    this.userForm.get('username')?.disable();
    this.userForm.get('email')?.disable();
  }
  
  confirmDelete(userId: string): void {
    this.deleteUserId = userId;
    this.showModal = true;
  }
  
  onDeleteUser(): void {
    if (!this.deleteUserId) return;
    
    this.actionLoading = true;
    
    this.userService.deleteUser(this.deleteUserId).subscribe({
      next: () => {
        this.actionLoading = false;
        this.success = 'User deleted successfully!';
        this.showModal = false;
        this.loadUsers(); // Refresh the list
        
        // Clear success message after a few seconds
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.actionLoading = false;
        this.error = err.error?.message || 'Failed to delete user.';
        this.showModal = false;
        
        // Clear error message after a few seconds
        setTimeout(() => this.error = '', 5000);
      }
    });
  }
  
  closeModal(): void {
    this.showModal = false;
    this.deleteUserId = null;
  }
  
  onSubmit(): void {
    if (this.userForm.invalid) {
      return;
    }
    
    this.actionLoading = true;
    this.error = '';
    this.success = '';
    
    const formData = this.userForm.getRawValue(); // Get values including disabled fields
    
    if (this.isEditMode && this.selectedUserId) {
      // If password is empty, remove it from the update data
      if (!formData.password) {
        delete formData.password;
      }
      
      this.userService.updateUser(this.selectedUserId, formData).subscribe({
        next: () => {
          this.actionLoading = false;
          this.success = 'User updated successfully!';
          this.loadUsers(); // Refresh the list
          this.resetForm();
          
          // Clear success message after a few seconds
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          this.actionLoading = false;
          this.error = err.error?.message || 'Failed to update user.';
          
          // Clear error message after a few seconds
          setTimeout(() => this.error = '', 5000);
        }
      });
    } else {
      this.userService.createUser(formData).subscribe({
        next: () => {
          this.actionLoading = false;
          this.success = 'User created successfully!';
          this.loadUsers(); // Refresh the list
          this.resetForm();
          
          // Clear success message after a few seconds
          setTimeout(() => this.success = '', 3000);
        },
        error: (err) => {
          this.actionLoading = false;
          this.error = err.error?.message || 'Failed to create user.';
          
          // Clear error message after a few seconds
          setTimeout(() => this.error = '', 5000);
        }
      });
    }
  }
  
  cancelEdit(): void {
    this.resetForm();
  }
  
  resetForm(): void {
    this.userForm.reset({
      roles: ['USER'],
      biometricEnabled: false
    });
    
    // Reset form state
    this.isEditMode = false;
    this.selectedUserId = null;
    
    // Reset validation
    this.userForm.get('username')?.enable();
    this.userForm.get('email')?.enable();
  }
  
  hasAdminRole(user: User): boolean {
    return user.roles.includes('ADMIN');
  }
  
  toggleAdminRole(user: User): void {
    this.actionLoading = true;
    
    let roles: string[];
    if (this.hasAdminRole(user)) {
      // Remove admin role
      roles = user.roles.filter(role => role !== 'ADMIN');
      if (roles.length === 0) {
        roles = ['USER']; // Ensure at least one role
      }
    } else {
      // Add admin role
      roles = [...user.roles, 'ADMIN'];
    }
    
    this.userService.updateUser(user.id, { roles }).subscribe({
      next: () => {
        this.actionLoading = false;
        this.success = `Admin privileges ${this.hasAdminRole(user) ? 'revoked from' : 'granted to'} ${user.username}`;
        this.loadUsers(); // Refresh the list
        
        // Clear success message after a few seconds
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.actionLoading = false;
        this.error = err.error?.message || 'Failed to update user roles.';
        
        // Clear error message after a few seconds
        setTimeout(() => this.error = '', 5000);
      }
    });
  }
}
