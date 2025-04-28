'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { BarChart, Camera, Inbox, ListTodo, Loader2, LogOut, PlusCircle, Settings, Share2, Star, Trophy, UserIcon } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Add Project interface
interface Project {
  id: string;
  name: string;
  slug?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    avatar: '',
    department: '',
    phone: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Fetch projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  // Function to fetch user's projects
  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      setProjectError(null);

      const response = await fetch('/api/projects', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProjects(data.projects || []);
      } else {
        throw new Error(data.error || 'Failed to load projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjectError(error instanceof Error ? error.message : 'Unknown error');
      // Don't show toast for better UX
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Initialize form fields when profile dialog opens
  const openProfileDialog = () => {
    setProfileData({
      name: session?.user?.name || '',
      avatar: session?.user?.avatar || session?.user?.image || '',
      department: session?.user?.department || '',
      phone: session?.user?.phone || '',
    });
    setAvatarPreview(null);
    setErrors({});
    setIsProfileOpen(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (profileData.phone && !/^\+?[\d\s()-]{7,}$/.test(profileData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const updateProfile = async () => {
    if (!validateForm()) return;

    try {
      setIsUpdating(true);
      toast.loading('Updating your profile...', { id: 'profile-update' });

      let avatarPath = profileData.avatar;

      // Handle file upload if there's a new avatar
      if (fileInputRef.current?.files?.length) {
        toast.loading('Uploading avatar...', { id: 'avatar-upload' });

        const formData = new FormData();
        formData.append('avatar', fileInputRef.current.files[0]);

        try {
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload avatar');
          }

          const uploadResult = await uploadResponse.json();
          avatarPath = uploadResult.path;

          toast.success('Avatar uploaded successfully', { id: 'avatar-upload' });
        } catch (error) {
          toast.error('Failed to upload avatar', { id: 'avatar-upload' });
          console.error('Avatar upload error:', error);
        }
      }

      // Update profile data
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profileData,
          avatar: avatarPath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Force a hard reload to ensure session data is refreshed
      // This is more reliable than just updating the session
      toast.success('Profile updated successfully! Refreshing page...', { id: 'profile-update' });

      // Add a slight delay before reload so the user sees the success message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile', { id: 'profile-update' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!session?.user?.name) return 'U';
    return session.user.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const mainNavItems = [
    {
      title: 'To do',
      href: '/dashboard',
      icon: ListTodo,
    },
    {
      title: "Today's Report",
      href: '/dashboard/report',
      icon: BarChart,
    },
    {
      title: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart,
    },
    {
      title: 'Leaderboard',
      href: '/dashboard/leaderboard',
      icon: Trophy,
    },
    {
      title: 'Share My Impact',
      href: '/dashboard/share',
      icon: Share2,
    },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <span className="text-xs font-bold text-primary-foreground">B</span>
          </div>
          <span className="font-semibold">MorfoTasks</span>
        </Link>
      </div>

      <div className="flex flex-col gap-1 p-2">
        <p className="px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Main Menu</p>
        {mainNavItems.map((item) => (
          <Link key={item.href} href={item.href} className={cn('sidebar-item', pathname === item.href && 'active')}>
            <item.icon className="sidebar-icon" />
            <span>{item.title}</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-1 p-2">
        <p className="px-3 py-2 text-xs font-medium uppercase text-muted-foreground">Projects</p>

        {/* Project header */}
        <Link href="/dashboard/projects" className={cn('sidebar-item', pathname === '/dashboard/projects' && 'active')}>
          <Inbox className="sidebar-icon" />
          <span>All Projects</span>
        </Link>

        {/* Loading state */}
        {isLoadingProjects && (
          <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading projects...</span>
          </div>
        )}

        {/* Error state */}
        {projectError && !isLoadingProjects && <div className="px-3 py-2 text-sm text-destructive">Failed to load projects</div>}

        {/* Project list */}
        {!isLoadingProjects && !projectError && projects.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No projects yet</div>}

        {!isLoadingProjects &&
          !projectError &&
          projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.slug || project.id}`}
              className={cn('sidebar-item pl-6', pathname === `/dashboard/projects/${project.slug || project.id}` && 'active')}
            >
              <Star className="sidebar-icon" />
              <span>{project.name}</span>
            </Link>
          ))}

        {/* Add project button */}
        <button className="sidebar-item text-muted-foreground" onClick={() => router.push('/dashboard/projects/new')}>
          <PlusCircle className="sidebar-icon" />
          <span>Add Project</span>
        </button>
      </div>

      {/* User profile section - keep existing code */}
      <div className="mt-auto border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-md p-2 hover:bg-muted">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={session?.user?.avatar || session?.user?.image || '/placeholder.svg'} alt={session?.user?.name || 'User'} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col text-left">
                <span className="text-sm font-medium truncate">{session?.user?.name || 'Guest User'}</span>
                <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={openProfileDialog}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Edit Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Enhanced Profile Edit Dialog - keep existing code */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Your Profile</DialogTitle>
            <DialogDescription>Update your profile information. Click save when you're done.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="advanced">Additional Info</TabsTrigger>
            </TabsList>
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="flex flex-col items-center mb-4">
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage src={avatarPreview || profileData.avatar || '/placeholder.svg'} alt="Profile preview" />
                  <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
                </Avatar>

                <div className="mt-2 flex flex-col items-center">
                  <Label htmlFor="avatar-upload" className="cursor-pointer flex items-center text-sm text-primary hover:underline">
                    <Camera className="h-3 w-3 mr-1" />
                    Upload new avatar
                  </Label>
                  <input id="avatar-upload" ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <span className="text-xs text-muted-foreground mt-1">Max size: 2MB</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="name" value={profileData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Your name" className={errors.name ? 'border-destructive' : ''} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={profileData.department} onChange={(e) => handleInputChange('department', e.target.value)} placeholder="e.g. Engineering, Marketing" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1234567890"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateProfile} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <span className="animate-spin mr-2">◠</span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
