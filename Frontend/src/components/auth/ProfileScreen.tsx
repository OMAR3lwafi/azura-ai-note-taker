import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, LogOut, Save } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [locale, setLocale] = useState<'ar' | 'en'>('en');
  const [autoDeleteDays, setAutoDeleteDays] = useState(90);

  useEffect(() => {
    // Load profile data
    if (user) {
      setDisplayName(user.user_metadata?.display_name || '');
      setLocale(user.user_metadata?.locale || 'en');
      setAutoDeleteDays(user.user_metadata?.auto_delete_days || 90);
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await updateProfile({
      display_name: displayName || undefined,
      locale,
      auto_delete_days: autoDeleteDays,
    });

    if (error) {
      toast.error('Failed to update profile', { description: error.message });
    } else {
      toast.success('Profile updated successfully');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
          <Button variant="outline" onClick={handleSignOut} disabled={loading}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="locale">Language</Label>
              <Select value={locale} onValueChange={(v) => setLocale(v as 'ar' | 'en')} disabled={loading}>
                <SelectTrigger id="locale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="autoDelete">Auto-Delete Old Meetings</Label>
              <Select
                value={String(autoDeleteDays)}
                onValueChange={(v) => setAutoDeleteDays(Number(v))}
                disabled={loading}
              >
                <SelectTrigger id="autoDelete">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">After 30 days</SelectItem>
                  <SelectItem value="60">After 60 days</SelectItem>
                  <SelectItem value="90">After 90 days</SelectItem>
                  <SelectItem value="180">After 6 months</SelectItem>
                  <SelectItem value="365">After 1 year</SelectItem>
                  <SelectItem value="0">Never</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically delete meetings older than the selected period
              </p>
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account ID</CardTitle>
            <CardDescription>Your unique user identifier</CardDescription>
          </CardHeader>
          <CardContent>
            <code className="block p-2 bg-muted rounded text-sm break-all">
              {user?.id}
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
