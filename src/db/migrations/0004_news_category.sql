ALTER TABLE news ADD COLUMN category TEXT;
CREATE INDEX idx_news_cat ON news(category, published_at DESC);
