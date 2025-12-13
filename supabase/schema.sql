-- =====================================================
-- Schéma de base de données Supabase pour Work Us
-- =====================================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- pour créer toutes les tables nécessaires.

-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: profiles (profils utilisateurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'creator', 'moderator', 'admin')),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir tous les profils
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Politique: Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- Table: user_data (données utilisateur)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  saved_items JSONB NOT NULL DEFAULT '[]',
  liked_items JSONB NOT NULL DEFAULT '[]',
  following JSONB NOT NULL DEFAULT '[]',
  followers JSONB NOT NULL DEFAULT '[]',
  skill_progress JSONB NOT NULL DEFAULT '{}',
  weekly_activity INTEGER[] NOT NULL DEFAULT ARRAY[0, 0, 0, 0, 0, 0, 0],
  today_activity INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Politique: Les utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can view own data" ON user_data
  FOR SELECT USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent modifier leurs propres données
CREATE POLICY "Users can update own data" ON user_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Politique: Les utilisateurs peuvent insérer leurs propres données
CREATE POLICY "Users can insert own data" ON user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Table: posts (publications)
-- =====================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  specialty_id TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  reposts INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  is_repost BOOLEAN NOT NULL DEFAULT false,
  original_post_id UUID REFERENCES posts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_specialty_id ON posts(specialty_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut voir les posts
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Politique: Les utilisateurs peuvent créer des posts
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Politique: Les auteurs peuvent modifier leurs posts
CREATE POLICY "Authors can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Politique: Les auteurs peuvent supprimer leurs posts
CREATE POLICY "Authors can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- =====================================================
-- Table: comments (commentaires)
-- =====================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- =====================================================
-- Table: notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  from_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_id TEXT,
  target_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- Table: activity_logs (journaux d'activité)
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  target_id TEXT,
  target_name TEXT,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- Table: reports (signalements)
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'discussion', 'user', 'specialty')),
  content_title TEXT,
  content_preview TEXT,
  content_author_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Authenticated users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- =====================================================
-- Fonctions et Triggers
-- =====================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Fonction pour créer automatiquement un profil
-- lors de l'inscription d'un utilisateur
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role, is_active, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    'user',
    true,
    NEW.email_confirmed_at IS NOT NULL
  );
  
  -- Créer aussi les données utilisateur initiales
  INSERT INTO public.user_data (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Table: user_settings (paramètres utilisateur)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  language TEXT NOT NULL DEFAULT 'fr',
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: user_stats (statistiques utilisateur)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_hours_learned DECIMAL(10, 2) NOT NULL DEFAULT 0,
  skills_worked_on INTEGER NOT NULL DEFAULT 0,
  exercises_completed INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  achievements_unlocked INTEGER NOT NULL DEFAULT 0,
  total_posts INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,
  total_likes_received INTEGER NOT NULL DEFAULT 0,
  total_followers INTEGER NOT NULL DEFAULT 0,
  total_following INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public stats" ON user_stats
  FOR SELECT USING (true);

CREATE POLICY "System can update stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: daily_activity (activité quotidienne)
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes_active INTEGER NOT NULL DEFAULT 0,
  actions_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON daily_activity(user_id, date);

-- RLS
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity" ON daily_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own activity" ON daily_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity" ON daily_activity
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- Fonction pour mettre à jour les stats automatiquement
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_stats_on_post()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_stats 
    SET total_posts = total_posts + 1, updated_at = NOW()
    WHERE user_id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_stats 
    SET total_posts = GREATEST(0, total_posts - 1), updated_at = NOW()
    WHERE user_id = OLD.author_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_stats_on_post
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_post();

CREATE OR REPLACE FUNCTION update_user_stats_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_stats 
    SET total_comments = total_comments + 1, updated_at = NOW()
    WHERE user_id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_stats 
    SET total_comments = GREATEST(0, total_comments - 1), updated_at = NOW()
    WHERE user_id = OLD.author_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_stats_on_comment
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_comment();

-- Modifier handle_new_user pour créer aussi settings et stats
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role, is_active, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    'user',
    true,
    NEW.email_confirmed_at IS NOT NULL
  );
  
  -- Créer les données utilisateur initiales
  INSERT INTO public.user_data (user_id)
  VALUES (NEW.id);
  
  -- Créer les paramètres par défaut
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Créer les stats initiales
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Vue pour les statistiques admin
-- =====================================================
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE is_active = true) as active_users,
  (SELECT COUNT(*) FROM profiles WHERE role = 'creator') as total_creators,
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days') as new_users_this_week;

-- =====================================================
-- Données initiales (admin par défaut)
-- =====================================================
-- Note: Créez d'abord un utilisateur admin via l'interface Supabase Auth,
-- puis mettez à jour son rôle avec cette requête:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@workus.com';

