import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { UserDataProvider } from './contexts/UserDataContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { PostsProvider } from './contexts/PostsContext'
import { ReportsProvider } from './contexts/ReportsContext'
import { NotificationsProvider } from './contexts/NotificationsContext'
import { ContentManagementProvider } from './contexts/ContentManagementContext'
import { AdminStatsProvider } from './contexts/AdminStatsContext'
import { ActivityProvider } from './contexts/ActivityContext'
import { HelpCenterProvider } from './contexts/HelpCenterContext'
import { Layout } from './components/layout/Layout'

// Pages
import { HomePage } from './pages/HomePage'
import { FeedPage } from './pages/FeedPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { SuggestionsPage } from './pages/SuggestionsPage'
import { ExplorePage } from './pages/ExplorePage'
import { SpecialtyPage } from './pages/SpecialtyPage'
import { MySpecialtiesPage } from './pages/MySpecialtiesPage'
import { DiscussionsPage } from './pages/DiscussionsPage'
import { FollowersPage } from './pages/FollowersPage'
import { CreatePage } from './pages/CreatePage'
import { StatsPage } from './pages/StatsPage'
import { SavedPage } from './pages/SavedPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AdminDashboard } from './pages/AdminDashboard'
import { ReportsPage } from './pages/ReportsPage'
import { AdminContentPage } from './pages/AdminContentPage'
import { HelpCenterPage } from './pages/HelpCenterPage'

/**
 * Application principale Work Us
 * Architecture modulaire avec routing centralisé et gestion des rôles
 */
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminStatsProvider>
        <ActivityProvider>
        <HelpCenterProvider>
        <UserDataProvider>
          <ContentManagementProvider>
          <PostsProvider>
          <ReportsProvider>
          <NotificationsProvider>
          <Routes>
        {/* Pages d'authentification (sans Layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Pages avec Layout */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              {/* Page d'accueil */}
              <Route path="/" element={<HomePage />} />
              
              {/* Feed */}
              <Route path="/feed" element={<FeedPage />} />
              
              {/* Catégories & Spécialités */}
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/suggestions" element={<SuggestionsPage />} />
              <Route path="/categories/explore" element={<ExplorePage />} />
              
              {/* Mes Spécialités (hub) */}
              <Route path="/specialty" element={<MySpecialtiesPage />} />
              
              {/* Spécialité individuelle */}
              <Route path="/specialty/:slug" element={<SpecialtyPage />} />
              
              {/* Discussions */}
              <Route path="/discussions" element={<DiscussionsPage />} />
              <Route path="/discussions/:type" element={<DiscussionsPage />} />
              
              {/* Followers */}
              <Route path="/followers" element={<FollowersPage />} />
              
              {/* Création de contenu */}
              <Route path="/create" element={<CreatePage />} />
              
              {/* Statistiques */}
              <Route path="/stats" element={<StatsPage />} />
              
              {/* Enregistrements */}
              <Route path="/saved" element={<SavedPage />} />
              
              {/* Profil & Paramètres */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              
              {/* Centre d'aide */}
              <Route path="/help" element={<HelpCenterPage />} />

              {/* Administration (admin uniquement) */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/content" element={<AdminContentPage />} />
            </Routes>
          </Layout>
          } />
          </Routes>
          </NotificationsProvider>
          </ReportsProvider>
          </PostsProvider>
          </ContentManagementProvider>
        </UserDataProvider>
        </HelpCenterProvider>
        </ActivityProvider>
        </AdminStatsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
