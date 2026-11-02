from sklearn.model_selection import train_test_split

def split_ratings(ratings, test_size=0.2, random_state=42):
    if len(ratings) < 2: raise ValueError("At least two ratings are required for evaluation")
    train, test = train_test_split(ratings, test_size=test_size, random_state=random_state)
    return train.reset_index(drop=True), test.reset_index(drop=True)
